const electron=require("electron");
const{ipcRenderer}=electron;

checkTodoCount();

//ilk penceredeki ekle butonunu aktif etme
const todoValue=document.querySelector("#todoValue");

//db den gelen verileri ana sayfada gosterme islemi
ipcRenderer.on("initApp",(e,todos)=>{
    todos.forEach(todo=>{
        drawRow(todo) 
    })
})  

todoValue.addEventListener("keypress",(e)=>{
    if(e.keyCode==13){
        ipcRenderer.send("newToDoModal:save",
        {ref: "main", todoValue: e.target.value
    });
    e.target.value="";
    }
})

document.querySelector("#addBtn").addEventListener("click",()=>{
    ipcRenderer.send("newToDoModal:save",{ ref: "main", todoValue: todoValue.value});
    todoValue.value="";
})

document.querySelector("#closeBtn").addEventListener("click",()=>{
    if(confirm("Çıkmak istiyor musunuz?")){
        ipcRenderer.send("todo:close")
    }
    
})
//db den gelen verilere anasayfada gosterme islemi
ipcRenderer.on("todo:addItem",(e,todo)=>{
  drawRow(todo);
  
  ipcRenderer.send("remove:todo",e.target.getAttribute("data-id"))
    checkTodoCount()

    
})

//todo sayılarını kontrol edip eğer aktif todo yoksa uyarı mesajı verir
function checkTodoCount(){
    const container = document.querySelector(".todo-container")
    const alertContainer = document.querySelector(".alert-container")

    //toplam kayıt sayısı alıp .total-count-container clasının textine yazdırır
    document.querySelector(".total-count-container").innerText=
    container.children.length;

    if(container.children.length !==0){
        alertContainer.style.display="none"
    }
    else{
        alertContainer.style.display="block"
    }
}

function drawRow(todo){
      //container
const container = document.querySelector(".todo-container")
//row
//div den bir element üret
const row=document.createElement("div")
row.className="row"

//col
const col=document.createElement("div")
col.className="p-2 mb-3 text-light bg-dark col-md-12 shadow card d-flex justify-content-center flex-row align-items-center"
col.style.backgroundColor="yellow"
//p
const p =document.createElement("p")
p.className="m-0 w-100"
p.innerText=todo.text

//sil btn
const deleteBtn =document.createElement("button")
deleteBtn.className="btn btn-sm btn-outline-danger flex-shrink-1"
deleteBtn.innerText="X"
deleteBtn.setAttribute("data-id",todo.id)

deleteBtn.addEventListener("click",(e)=>{
    if(confirm("bu kaydı silmek istedipinizden emin misiniz?")){
        e.target.parentNode.parentNode.remove()
        //silinen veririn id si alınıyor
        ipcRenderer.send("remove:todo",e.target.getAttribute("data-id"))
        checkTodoCount()
    }
})


//içeriden dışarıya doğru todo listleri ekledik
col.appendChild(p);
col.appendChild(deleteBtn);
row.appendChild(col);
container.appendChild(row);
checkTodoCount();
}




