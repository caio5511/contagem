const frm = document.querySelector("form")
const lista = document.querySelector("#lista")
const multiSection = document.querySelector(".multiplicador-section")
const multiToggle = document.querySelector(".multi-toggle") || multiSection.querySelector('label')

let produtos = JSON.parse(localStorage.getItem("produtos")) || []

// alvo atual para adicionar/editar e subtrair
// { tipo: 'pai'|'filho', paiIndex: number, filhoIndex?: number }
let alvo = { tipo: 'pai', paiIndex: -1 }

let history = []

// --- Compat: migra do formato antigo {nome, valor} para o formato novo ---
function migrarParaFormatoNovo(dados) {
    if (!Array.isArray(dados)) return []

    // formato novo esperado: { id, nome, valor, filhos: [...] }
    // formato antigo: { nome, valor }
    const temFilhos = dados.some((p) => Array.isArray(p?.filhos))

    if (temFilhos) return dados

    // converte lista plana -> pais sem filhos
    return dados.map((p, idx) => ({
        id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + '-' + idx,
        nome: p.nome,
        valor: p.valor,
        filhos: []
    }))
}

produtos = migrarParaFormatoNovo(produtos)

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
    const nome = (frm.inProduto?.value || "").trim()

    if (qtde > 0 && unit > 0 && nome) {
        const previousState = JSON.parse(localStorage.getItem("produtos") || "[]");
        history.push([...previousState]);

        const valor = qtde * unit

        // Se houver alvo selecionado, soma no alvo.
        if (alvo.tipo === 'pai' && alvo.paiIndex >= 0) {
            produtos[alvo.paiIndex].valor += valor
        } else if (alvo.tipo === 'filho' && alvo.paiIndex >= 0 && typeof alvo.filhoIndex === 'number' && alvo.filhoIndex >= 0) {
            produtos[alvo.paiIndex].filhos[alvo.filhoIndex].valor += valor
        } else {
            // Fallback: mantém comportamento antigo (cria/soma pelo nome digitado)
            const paiIndex = produtos.findIndex(p => p.nome === nome)
            if (paiIndex !== -1) {
                produtos[paiIndex].valor += valor
            } else {
                produtos.push({
                    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + '-' + Math.random(),
                    nome,
                    valor,
                    filhos: []
                })
            }
        }

        localStorage.setItem("produtos", JSON.stringify(produtos))
        renderLista()

        // zera UI
        alvo = { tipo: 'pai', paiIndex: -1 }
        frm.reset()
        if (frm.inProduto) frm.inProduto.value = ''
        if (frm.inValor) frm.inValor.value = ''
        inQtde.value = ''
        inUnit.value = ''
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
    const nome = (frm.inProduto?.value || "").trim()
    const valor = Number(frm.inValor.value)

    if (!nome || Number.isNaN(valor)) {
        alert("Insira Produto e Valor válidos")
        return
    }

    // Se um alvo estiver selecionado, adiciona/edita o tipo correto.
    if (alvo.tipo === 'pai' && alvo.paiIndex >= 0) {
        // Somar/editar no PA I (valor próprio do pai)
        const pai = produtos[alvo.paiIndex]
        // regra: se o usuário digitou o MESMO nome do pai, atualiza o valor do pai
        // caso contrário, considera como filho do pai (para manter UX de criar filhos)
        if (nome === pai.nome) {
            pai.valor += valor
        } else {
            const filhoIndex = pai.filhos.findIndex(f => f.nome === nome)
            if (filhoIndex === -1) {
                pai.filhos.push({
                    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + '-' + Math.random(),
                    nome,
                    valor
                })
            } else {
                pai.filhos[filhoIndex].valor += valor
            }
        }
    } else if (alvo.tipo === 'filho' && alvo.paiIndex >= 0 && typeof alvo.filhoIndex === 'number' && alvo.filhoIndex >= 0) {

        // adiciona/edita novamente o filho selecionado
        const pai = produtos[alvo.paiIndex]
        const paiFilhos = pai.filhos
        const filho = paiFilhos[alvo.filhoIndex]
        if (filho.nome === nome) {
            filho.valor += valor
        } else {
            // se o nome digitado for diferente, procura outro filho pelo nome
            const filhoIndex = paiFilhos.findIndex(f => f.nome === nome)
            if (filhoIndex === -1) {
                paiFilhos.push({
                    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + '-' + Math.random(),
                    nome,
                    valor
                })
            } else {
                paiFilhos[filhoIndex].valor += valor
            }
        }
    } else {
        // fallback: comportamento antigo = adicionar/somar no pai pelo nome
        const index = produtos.findIndex(p => p.nome === nome)
        if (index === -1) {
            produtos.push({
                id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + '-' + Math.random(),
                nome,
                valor,
                filhos: []
            })
        } else {
            produtos[index].valor += valor
        }
    }

    localStorage.setItem("produtos", JSON.stringify(produtos))
    renderLista()

    // zera alvo após usar
    alvo = { tipo: 'pai', paiIndex: -1 }
    frm.reset()
    if (frm.inProduto) frm.inProduto.focus()
})


function renderLista() {
    lista.innerHTML = ""

    // pai expandido persistente (para não fechar ao editar filho)
    const filhosAbertosPaiId = localStorage.getItem("filhosAbertosPaiId") || null

    if (produtos.length === 0) {
        lista.innerHTML = "<li class='empty'>Lista vazia</li>"
        return
    }

    const produtosOrdenados = [...produtos].sort((a, b) => a.nome.localeCompare(b.nome));

    produtosOrdenados.forEach((pai) => {
        const paiIndex = produtos.findIndex(p => p.id === pai.id)
        if (paiIndex === -1) return

        const li = document.createElement('li')
        // garante que o conteúdo do pai (header + filhos) fique em coluna
        li.style.flexDirection = 'column'
        li.style.justifyContent = 'flex-start'

        const headerRow = document.createElement('div')

        headerRow.style.display = 'flex'
        headerRow.style.alignItems = 'center'
        headerRow.style.gap = '10px'
        headerRow.style.width = '100%'
        headerRow.style.justifyContent = 'center'
        headerRow.style.flexWrap = 'nowrap'
        headerRow.style.marginLeft = '0'
        headerRow.style.marginRight = '0'




        const toggleBtn = document.createElement('button')
        toggleBtn.type = 'button'
        toggleBtn.textContent = (pai.filhos?.length || 0) > 0 ? '▶' : '—'
        toggleBtn.className = 'btn-subtrair btn-small'
        toggleBtn.style.background = 'linear-gradient(135deg, #0ea5e9, #0284c7)'
        toggleBtn.style.boxShadow = '0 6px 20px rgba(14,165,233,0.4)'
        toggleBtn.style.height = '40px'

        const titleSpan = document.createElement('span')
        titleSpan.textContent = `${pai.nome} - ${Number(pai.valor).toFixed(3)}`

        const btnSubContainer = document.createElement('div')
        btnSubContainer.className = 'btn-sub-container'
        btnSubContainer.style.display = 'flex'
        btnSubContainer.style.gap = '4px'

        const btnSub24 = document.createElement('button')
        btnSub24.textContent = '-2.4'
        btnSub24.className = 'btn-subtrair'
        btnSub24.type = 'button'

        const btnSub2 = document.createElement('button')
        btnSub2.textContent = '-2'
        btnSub2.className = 'btn-subtrair btn-small'
        btnSub2.type = 'button'

        btnSubContainer.appendChild(btnSub24)
        btnSubContainer.appendChild(btnSub2)

        headerRow.appendChild(toggleBtn)
        headerRow.appendChild(titleSpan)
        headerRow.appendChild(btnSubContainer)

        li.appendChild(headerRow)

        const filhosContainer = document.createElement('div')
        filhosContainer.style.width = '100%'
        filhosContainer.style.marginTop = '12px'
        filhosContainer.style.display = 'none'
        filhosContainer.style.flexDirection = 'column'
        filhosContainer.style.alignItems = 'center'

        li.appendChild(filhosContainer)

        // estado inicial de expandir/recolher do pai (persistente)
        let aberto = filhosAbertosPaiId === pai.id
        filhosContainer.style.display = aberto ? 'block' : 'none'
        if (pai.filhos?.length) {
            toggleBtn.textContent = aberto ? '▼' : '▶'
        } else {
            toggleBtn.textContent = '—'
        }

        // Se vier marcado como expandido, renderiza os filhos agora.
        if (aberto && (pai.filhos?.length || 0) > 0) {
            filhosContainer.innerHTML = ''
            ;(pai.filhos || []).forEach((filho) => {
                const filhoIndex = produtos[paiIndex].filhos.findIndex(f => f.id === filho.id)
                if (filhoIndex === -1) return

                const childItem = document.createElement('div')
                childItem.style.display = 'flex'
                childItem.style.justifyContent = 'space-between'
                childItem.style.alignItems = 'center'
                childItem.style.gap = '10px'
                childItem.style.padding = '10px 12px'
                childItem.style.borderRadius = '16px'
                childItem.style.border = '1px solid rgba(255,255,255,0.4)'
                childItem.style.background = 'rgba(255,255,255,0.7)'
                childItem.style.marginBottom = '10px'
                childItem.style.flexDirection = 'column'
                childItem.style.alignItems = 'stretch'

                const childTitle = document.createElement('span')
                childTitle.textContent = `${filho.nome} - ${Number(filho.valor).toFixed(3)}`
                childTitle.style.flex = '1'
                childTitle.style.cursor = 'pointer'

                const childBtns = document.createElement('div')
                childBtns.style.display = 'flex'
                childBtns.style.flexDirection = 'row'
                childBtns.style.gap = '6px'
                childBtns.style.marginTop = '8px'
                childBtns.style.width = '100%'
                childBtns.style.justifyContent = 'center'

                const childSub24 = document.createElement('button')
                childSub24.type = 'button'
                childSub24.textContent = '-2.4'
                childSub24.className = 'btn-subtrair'
                childSub24.style.height = '38px'
                childSub24.style.padding = '8px 12px'
                childSub24.style.fontSize = '13px'

                const childSub2 = document.createElement('button')
                childSub2.type = 'button'
                childSub2.textContent = '-2'
                childSub2.className = 'btn-subtrair btn-small'
                childSub2.style.height = '38px'

                const childDel = document.createElement('button')
                childDel.type = 'button'
                childDel.textContent = 'Excluir'
                childDel.className = 'btn-subtrair btn-small'
                childDel.style.background = 'linear-gradient(135deg, #f97316, #ea580c)'
                childDel.style.boxShadow = '0 6px 20px rgba(249,115,22,0.35)'
                childDel.style.height = '38px'
                childDel.style.fontSize = '13px'

                childBtns.appendChild(childSub24)
                childBtns.appendChild(childSub2)
                childBtns.appendChild(childDel)

                childItem.appendChild(childTitle)
                childItem.appendChild(childBtns)
                childItem.style.width = '92%'
                filhosContainer.appendChild(childItem)

                childTitle.addEventListener('click', () => {
                    alvo = { tipo: 'filho', paiIndex, filhoIndex }
                    frm.inProduto.value = filho.nome
                    frm.inValor.value = filho.valor
                })

                childSub24.addEventListener('click', () => aplicarSubtracao(2.4, 'filho', filhoIndex))
                childSub2.addEventListener('click', () => aplicarSubtracao(2, 'filho', filhoIndex))

                childDel.addEventListener('click', () => {
                    const ok = confirm(`Excluir o filho: ${filho.nome}?`)
                    if (!ok) return

                    const previousState = JSON.parse(localStorage.getItem("produtos") || "[]");
                    history.push([...previousState]);

                    produtos[paiIndex].filhos.splice(filhoIndex, 1)
                    localStorage.setItem("produtos", JSON.stringify(produtos))
                    renderLista()
                })
            })
        }


        function aplicarSubtracao(valorSub, tipo, filhoIndex) {
            const previousState = JSON.parse(localStorage.getItem("produtos") || "[]");
            history.push([...previousState]);

            if (tipo === 'pai') {
                produtos[paiIndex].valor = Math.max(0, produtos[paiIndex].valor - valorSub)
            } else {
                produtos[paiIndex].filhos[filhoIndex].valor = Math.max(0, produtos[paiIndex].filhos[filhoIndex].valor - valorSub)
            }

        localStorage.setItem("produtos", JSON.stringify(produtos))

            // Para não fechar ao editar filho, deixa o pai selecionado como aberto
            if (tipo === 'filho' && paiIndex >= 0) {
                localStorage.setItem("filhosAbertosPaiId", produtos[paiIndex].id)
            }
            renderLista()
        }


        // seleção do pai (último clicado)
        titleSpan.addEventListener('click', () => {
            alvo = { tipo: 'pai', paiIndex }
            frm.inProduto.value = pai.nome
            frm.inValor.value = pai.valor
        })

        // seleção do filho (último clicado) -> precisa atualizar alvo também
        // (feito dentro do render dos filhos, onde já existe alvo = {tipo:'filho', ...})


        // toggle filhos
        toggleBtn.addEventListener('click', () => {
            if ((pai.filhos?.length || 0) === 0) return
            aberto = !aberto
            filhosContainer.style.display = aberto ? 'block' : 'none'
            toggleBtn.textContent = aberto ? '▼' : '▶'

            localStorage.setItem("filhosAbertosPaiId", aberto ? pai.id : "")

            if (aberto && filhosContainer.children.length === 0) {
                ;(pai.filhos || []).forEach((filho) => {
                    const filhoIndex = produtos[paiIndex].filhos.findIndex(f => f.id === filho.id)
                    if (filhoIndex === -1) return

                    const childItem = document.createElement('div')
                    childItem.style.display = 'flex'
                    childItem.style.justifyContent = 'space-between'
                    childItem.style.alignItems = 'center'
                    childItem.style.gap = '10px'
                    childItem.style.padding = '10px 12px'
                    childItem.style.borderRadius = '16px'
                    childItem.style.border = '1px solid rgba(255,255,255,0.4)'
                    childItem.style.background = 'rgba(255,255,255,0.7)'
                    childItem.style.marginBottom = '10px'
                    childItem.style.flexDirection = 'column'
                    childItem.style.alignItems = 'stretch'


                    const childTitle = document.createElement('span')
                    childTitle.textContent = `${filho.nome} - ${Number(filho.valor).toFixed(3)}`
                    childTitle.style.flex = '1'
                    childTitle.style.cursor = 'pointer'

                    const childBtns = document.createElement('div')
                    childBtns.style.display = 'flex'
                    childBtns.style.flexDirection = 'row'
                    childBtns.style.gap = '6px'
                    childBtns.style.marginTop = '8px'
                    childBtns.style.width = '100%'
                    childBtns.style.justifyContent = 'center'



                    const childSub24 = document.createElement('button')
                    childSub24.type = 'button'
                    childSub24.textContent = '-2.4'
                    childSub24.className = 'btn-subtrair'
                    childSub24.style.height = '38px'
                    childSub24.style.padding = '8px 12px'
                    childSub24.style.fontSize = '13px'

                    const childSub2 = document.createElement('button')
                    childSub2.type = 'button'
                    childSub2.textContent = '-2'
                    childSub2.className = 'btn-subtrair btn-small'
                    childSub2.style.height = '38px'

                    const childDel = document.createElement('button')
                    childDel.type = 'button'
                    childDel.textContent = 'Excluir'
                    childDel.className = 'btn-subtrair btn-small'
                    childDel.style.background = 'linear-gradient(135deg, #f97316, #ea580c)'
                    childDel.style.boxShadow = '0 6px 20px rgba(249,115,22,0.35)'
                    childDel.style.height = '38px'
                    childDel.style.fontSize = '13px'

                    childBtns.appendChild(childSub24)
                    childBtns.appendChild(childSub2)
                    childBtns.appendChild(childDel)


                    childItem.appendChild(childTitle)
                    childItem.appendChild(childBtns)
                    // garante coluna centralizada com largura ajustada
                    childItem.style.width = '92%'
                    filhosContainer.appendChild(childItem)


                    childTitle.addEventListener('click', () => {
                        alvo = { tipo: 'filho', paiIndex, filhoIndex }
                        frm.inProduto.value = filho.nome
                        frm.inValor.value = filho.valor
                    })

                    childSub24.addEventListener('click', () => aplicarSubtracao(2.4, 'filho', filhoIndex))
                    childSub2.addEventListener('click', () => aplicarSubtracao(2, 'filho', filhoIndex))

                    childDel.addEventListener('click', () => {
                        const ok = confirm(`Excluir o filho: ${filho.nome}?`)
                        if (!ok) return

                        const previousState = JSON.parse(localStorage.getItem("produtos") || "[]");
                        history.push([...previousState]);

                        produtos[paiIndex].filhos.splice(filhoIndex, 1)
                        localStorage.setItem("produtos", JSON.stringify(produtos))
                        renderLista()
                    })

                })
            }
        })

        // subtrai pai
        btnSub24.addEventListener('click', () => aplicarSubtracao(2.4, 'pai'))
        btnSub2.addEventListener('click', () => aplicarSubtracao(2, 'pai'))

        lista.appendChild(li)
    })
}


  const btLimpar = document.querySelector("#btLimpar")
  const btDesfazer = document.querySelector("#btDesfazer")

    btLimpar.addEventListener("click", () => {
        if (confirm("Deseja realmente limpar a lista?")) {
            produtos = []
            localStorage.removeItem("produtos")
            history = []
            alvo = { tipo: 'pai', paiIndex: -1 }
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
