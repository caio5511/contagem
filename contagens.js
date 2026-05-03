const frm = document.querySelector("form")
const lista = document.querySelector("#lista")
const totalResp = document.querySelector("#total")

let produtos = JSON.parse(localStorage.getItem("produtos")) || []

let editIndex = -1

renderLista()

frm.addEventListener("submit", (e) => {

    e.preventDefault()

    const nome = frm.inProduto.value
    const valor = Number(frm.inValor.value)

    const index = produtos.findIndex(p => p.nome === nome)

    if (index === -1) {
        produtos.push({ nome, valor })
    } else {
        produtos[index].valor += valor
    }

    localStorage.setItem("produtos", JSON.stringify(produtos))
    renderLista()

    frm.reset()
    frm.inProduto.focus()
})

function renderLista() {


    lista.innerHTML = ""

    if (produtos.length === 0) {
        lista.innerHTML = "<li class='empty'>Lista vazia</li>"
        return
    }

    produtos.forEach((prod, i) => {
        const li = document.createElement("li")

        li.textContent = `${prod.nome} - ${prod.valor.toFixed(2)}`

        li.style.cursor = "pointer"


        li.addEventListener("click", () => {
            frm.inProduto.value = prod.nome
            frm.inValor.value = prod.valor
            editIndex = i
        })

        lista.appendChild(li)


    })

    const btLimpar = document.querySelector("#btLimpar")

    btLimpar.addEventListener("click", () => {
        if (confirm("Deseja realmente limpar a lista?")) {
            produtos = []
            localStorage.removeItem("produtos")
            editIndex = -1
            renderLista()
        }
    })

}

if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js")
}