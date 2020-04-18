const electron = require("electron");
const url = require("url");
const path = require("path");
const db = require("./lib/connection").db;
const mssql = require("mssql");
//const express = require("express");
const { app, BrowserWindow, Menu, ipcMain, MenuItem } = electron;
const dialog = electron.dialog;
const globalShortCut = electron.globalShortcut;
let mainWindow, addWindow;

var dbconfig = {
  database: "sema",
  server: "localhost",
  port: "1433"
};

function getRecord() {
  var conn = new mssql.ConnectionPool(dbconfig);
  conn.connect(function(err) {
    if (err) throw err;

    var req = new mssql.Request(conn);
    req.query("select * from sema.todos", function(e, recordset) {
      if (e) throw e;
      else console.log(recordset);
      conn.close();
    });
  });
}

app.on("ready", () => {
  mainWindow = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true
    }
  });
  mainWindow.setResizable(false);
  //pencerenin oluşturulması
  mainWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, "mainWindow.html"),
      protocol: "file:",
      slashes: true,
      frame: false //kapatma,aşağı indrime ve buyutme butonları kaldırıldı.
    })
  );
  //menunun olusturulması
  const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
  Menu.setApplicationMenu(mainMenu);

  ipcMain.on("todo:close", () => {
    app.quit();
    addWindow = null;
  });

  //new todo penceresi eventleri
  ipcMain.on("newToDoModal:close", () => {
    addWindow.close();
    addWindow = null();
  });

  ipcMain.on("newToDoModal:save", (err, data) => {
    if (data) {
      db.query(
        "INSERT INTO sema.todos SET text = ?",
        data.todoValue,
        (error, result, fields) => {
          console.log(data);
          console.log(error);
          console.log(result);
          if (result.insertId > 0) {
            mainWindow.webContents.send("todo:addItem", {
              id: result.insertId,
              text: data.todoValue
            });
          }
        }
      );

      //text deki kaydedilen değeri ekrana yazdırır
      //console.log(todoList);
      //mainWindow.webContents.send("todo:addItem",todo);

      if (data.ref == "new") {
        addWindow.close();
        addWindow = null;
      }
    }
  });

  //context menu dizaynı
  const contextMenu = new Menu();

  contextMenu.append(new MenuItem({ label: "Kes", role: "cut" }));
  contextMenu.append(new MenuItem({ label: "Kopyala", role: "copy" }));
  contextMenu.append(new MenuItem({ label: "Yapıştır", role: "paste" }));
  contextMenu.append(new MenuItem({ label: "Sil", role: "delete" }));
  contextMenu.append(new MenuItem({ label: "Tümünü Seç", role: "selectAll" }));

  mainWindow.webContents.on("context-menu", function(e, params) {
    contextMenu.popup(mainWindow, params.x, params.y);
  });

  //veriler hazır olduğunda verş tabanı işlemlerini yapıyoruz
  //ana pencerenin verileri geldiyse ->
  mainWindow.webContents.once("dom-ready", () => {
    db.query("SELECT * FROM sema.todos", (error, results, fields) => {
      console.log(results);
      mainWindow.webContents.send("initApp", results);
    });
  });

  ipcMain.on("remove:todo", (e, id) => {
    db.query(
      "delete from sema.todos where id = ?",
      id,
      (error, result, fields) => {
        //console.log(result)
        if (result.affectedRows > 0) {
          console.log("silme işlemi başarılı bir şekilde gerçekleşti...");
        }
      }
    );
  });
});

//manu template yapısı
const mainMenuTemplate = [
  {
    label: "Dosya",
    submenu: [
      {
        label: "Yeni Todo Ekle",
        accelerator: "CmdorCtrl + T",
        click() {
          createWindow();
        }
      },
      { type: "separator" },
      {
        label: "Çıkış",
        accelerator: process.platform == "darwin" ? "Command+Q" : "Ctrl+Q", //kısayol oluşturur
        role: "quit"
      }
    ]
  },
  {
    label: "Yardım",
    submenu: [
      {
        label: "About Electron",
        click: function() {
          electron.shell.openExternal("https://electron.atom.io");
        },
        accelerator: "CmdorCtrl + H"
      }
    ]
  }
];

function createWindow() {
  addWindow = new BrowserWindow({
    width: 500,
    height: 300,
    webPreferences: {
      nodeIntegration: true
    }
    // title="Yeni Bir Pencere"
    //frame:false //kapatma,aşağı indrime ve buyutme butonları kaldırıldı.
  });

  addWindow.setResizable(false);

  addWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, "newToDoModal.html"),
      protocol: "file:",
      slashes: true
    })
  );

  addWindow.on("close", () => {
    addWindow = null;
  });
}
