const frm = document.querySelector("form")
const lista = document.querySelector("#lista")
const multiSection = document.querySelector(".multiplicador-section")
const multiToggle = document.querySelector(".multi-toggle") || multiSection.querySelector('label')

let produtos = JSON.parse(localStorage.getItem("produtos")) || []

let editIndex = -1
let history = []

renderLista()

// Toggle multiplicador
if (multiToggle) {
  multiToggle.style.cursor = 'pointer'
  multiToggle.addEventListener('click', () => {
    multiSection.classList.toggle('active')
  })
}

const btMultiplicar = document.querySelector("#btMultiplicar")
const inQtde = document.querySelector("#inQtde")
const inUnit = document.querySelector("#inUnit")

btMultiplicar.addEventListener("click", () => {
    const qtde = parseFloat(inQtde.value) || 0
    const unit = parseFloat(inUnit.value) || 0
    if (qtde > 0 && unit > 0 && frm.inProduto.value.trim()) {
        const previousState = JSON.parse(localStorage.getItem("produtos") || "[]");
        history.push([...previousState]);
        const valor = qtde * unit
        // Soma ao valor atual se existir, senão novo
        const currentValor = parseFloat(frm.inValor.value) || 0
        const novoValor = currentValor + valor
        frm.inValor.value = novoValor.toFixed(3)
        
        // Aplicar soma diretamente à lista se produto existe
        const nome = frm.inProduto.value.trim()
        const index = produtos.findIndex(p => p.nome === nome)
        if (index !== -1) {
            produtos[index].valor += valor
            localStorage.setItem("produtos", JSON.stringify(produtos))
            renderLista()
            // Limpar seleção após alteração
            frm.reset()
            editIndex = -1
        } else {
            frm.inProduto.focus()
        }
    } else {
        alert("Insira Qtde, Unitário e Produto válidos")
    }
    inQtde.value = ''
    inUnit.value = ''
})

frm.addEventListener("submit", (e) => {

    e.preventDefault()

    const previousState = JSON.parse(localStorage.getItem("produtos") || "[]");
    history.push([...previousState]);
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

    // Ordenar por nome alfabeticamente
    const produtosOrdenados = [...produtos].sort((a, b) => a.nome.localeCompare(b.nome));

    produtosOrdenados.forEach((prod, displayIndex) => {
        const i = produtos.findIndex(p => p.nome === prod.nome && Math.abs(p.valor - prod.valor) < 0.001);
        const li = document.createElement("li")

        const displaySpan = document.createElement('span');
        displaySpan.textContent = `${prod.nome} - ${prod.valor.toFixed(3)}`;
        li.appendChild(displaySpan);

        const btnSubContainer = document.createElement('div');
        btnSubContainer.className = 'btn-sub-container';
        btnSubContainer.style.display = 'flex';
        btnSubContainer.style.gap = '4px';

        const btnSub24 = document.createElement('button');
        btnSub24.textContent = '-2.4';
        btnSub24.className = 'btn-subtrair';
        btnSub24.type = 'button';
        btnSubContainer.appendChild(btnSub24);

        const btnSub2 = document.createElement('button');
        btnSub2.textContent = '-2';
        btnSub2.className = 'btn-subtrair btn-small';
        btnSub2.type = 'button';
        btnSubContainer.appendChild(btnSub2);

        li.appendChild(btnSubContainer);

        // Click no display para editar
        displaySpan.addEventListener("click", () => {
            frm.inProduto.value = prod.nome;
            frm.inValor.value = prod.valor;
            editIndex = i;
        });

// Botão -2.4
        btnSub24.addEventListener("click", () => {
            const previousState = JSON.parse(localStorage.getItem("produtos") || "[]");
            history.push([...previousState]);
            produtos[i].valor = Math.max(0, produtos[i].valor - 2.4);
            localStorage.setItem("produtos", JSON.stringify(produtos));
            renderLista();
        });

// Botão -2
        btnSub2.addEventListener("click", () => {
            const previousState = JSON.parse(localStorage.getItem("produtos") || "[]");
            history.push([...previousState]);
            produtos[i].valor = Math.max(0, produtos[i].valor - 2);
            localStorage.setItem("produtos", JSON.stringify(produtos));
            renderLista();
        });

        lista.appendChild(li);
    })
}

  const btLimpar = document.querySelector("#btLimpar")
  const btDesfazer = document.querySelector("#btDesfazer")

    btLimpar.addEventListener("click", () => {
        if (confirm("Deseja realmente limpar a lista?")) {
            produtos = []
            localStorage.removeItem("produtos")
            history = []
            editIndex = -1
            renderLista()
        }
    })

  btDesfazer.addEventListener("click", () => {
    if (history.length > 0) {
      const previous = history.pop()
      produtos = [...previous]
      localStorage.setItem("produtos", JSON.stringify(produtos))
      renderLista()
    }
  })

if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js")
}
