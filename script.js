// Inicializa o banco de dados
const request = indexedDB.open("FuncionariosDB", 1); // Abertura da versão 1 do banco de dados IndexedDB

request.onupgradeneeded = function (event) { // Evento de atualização, serve para atualizar versões
    let db = event.target.result; // Retorna o banco de dados que está sendo criado ou atualizado
    let store = db.createObjectStore("funcionarios", { keyPath: "id", autoIncrement: true }); // Cria o espaço onde os dados são armazenados

    // Criação de índices
    store.createIndex("nome", "nome", { unique: false });
    store.createIndex("cpf", "cpf", { unique: true });
    store.createIndex("email", "email", { unique: true });
    store.createIndex("telefone", "telefone", { unique: true });
    store.createIndex("cargo", "cargo", { unique: false });
    store.createIndex("data_nascimento", "data_nascimento", { unique: false });
};

request.onsuccess = function (event) {
    console.log("Banco de dados carregado com sucesso!");
    listarFuncionarios(); // Garante que os dados sejam carregados ao iniciar
};

request.onerror = function (event) {
    console.error("Erro ao abrir o IndexedDB:", event.target.error);
};

// Função auxiliar para verificar se o banco de dados foi carregado corretamente
function verificarDB() {
    if (!request.result) {
        console.error("O banco de dados não foi carregado corretamente.");
        return null;
    }
    return request.result;
}

// Captura o evento de envio do formulário
document.querySelector(".add_names").addEventListener("submit", function (event) {
    event.preventDefault();
    let funcionario = { // Criar objeto funcionário, as palavras seguidas de dois pontos são atributos
        nome: document.querySelector("#nome").value,
        cpf: document.querySelector("#cpf").value,
        email: document.querySelector("#email").value,
        telefone: document.querySelector("#telefone").value,
        data_nascimento: document.querySelector("#data_nascimento").value,
        cargo: document.querySelector("#cargo").value
    };

    adicionarFuncionario(funcionario);
});

document.addEventListener("click", function(e) {
    if (e.target.classList.contains("excluir")) {
        const id = Number(e.target.dataset.id);
        deletarFuncionario(id);
    }
    if (e.target.classList.contains("alterar")) {
        const id = Number(e.target.dataset.id);
        preencherFormulario(id);
    }
});

// Função para listar funcionários com feedback visual
function listarFuncionarios() {
    let db = verificarDB();
    if (!db) {
        mostrarFeedback("Erro ao carregar banco de dados!", "error");
        return;
    }

    let transaction = db.transaction("funcionarios", "readonly"); // Faz leitura do banco de funcionários
    let store = transaction.objectStore("funcionarios");

    let listaFuncionarios = document.querySelector(".your_dates"); // Exibir lista no HTML
    listaFuncionarios.innerHTML = ""; // Limpa antes de exibir
    
    let cursorRequest = store.openCursor(); // É o jeito que o IndexedDB usa para percorrer todos os registros dentro da Store "funcionarios"
    
    cursorRequest.onsuccess = function (event) { // Lista executada com sucesso
        let cursor = event.target.result; // O cursor aponta para cada registro
        if (cursor) { // Se o registro existir
            let funcionario = cursor.value; // O cursor busca as informações(valores) dos funcionários
            listaFuncionarios.innerHTML += `<p>ID: ${funcionario.id} - Nome: ${funcionario.nome} - CPF: ${funcionario.cpf}
            - E-mail: ${funcionario.email} - Telefone: ${funcionario.telefone} - Cargo: ${funcionario.cargo} - Data de nascimento: ${funcionario.data_nascimento}</p>
            <button class="alterar" data-id="${funcionario.id}">Alterar</button>
            <button class="excluir" data-id="${funcionario.id}">Excluir</button>
            `;
            
            cursor.continue();
        } else {
            mostrarFeedback("Lista de funcionários carregada com sucesso!", "success");
        }
    };

    cursorRequest.onerror = function (event) { // Erro ao listar funcionários
        console.error("Erro ao listar funcionários:", event.target.error);
        mostrarFeedback("Erro ao listar funcionários!", "error");
    };
}

// Função para adicionar um funcionário com feedback visual
function adicionarFuncionario(funcionario) {
    let db = verificarDB(); // Verificar o banco para ver se ele existe
    if (!db) return; // Se estiver vazio sai da função

    let transaction = db.transaction("funcionarios", "readwrite"); // O readwrite permite gerir (CRUD) os dados
    let store = transaction.objectStore("funcionarios"); // Referência direta de onde os dados serão armazenados
    
    let addRequest = store.add(funcionario); // Adicionando funcionário na store
    addRequest.onsuccess = function () { // Funcionário adicionado com sucesso
        console.log("Funcionário adicionado com sucesso!");
        mostrarFeedback("Funcionário cadastrado com sucesso!", "success"); // Mostra feedback visual
        listarFuncionarios(); // Chama a função listar funcionário
    };

    addRequest.onerror = function (event) { // Erro ao adicionar funcionário
        console.error("Erro ao adicionar funcionário:", event.target.error);
        mostrarFeedback("Erro ao cadastrar funcionário!", "error"); // Exibe erro na interface
    };
}

// Função para atualizar um funcionário com feedback visual
function atualizarFuncionario(id, novosDados) { // O id é para informar o n° do registro do funcionário e o novosDados para alterar a informação desejada
    let db = verificarDB();
    if (!db) return;

    let transaction = db.transaction("funcionarios", "readwrite");
    let store = transaction.objectStore("funcionarios");

    let getRequest = store.get(id); // Pega o número (id) do funcionário do banco de dados
    getRequest.onsuccess = function () { // Obteve sucesso ao achar a ID do funcionário
        let funcionario = getRequest.result;
        if (funcionario) {
            Object.assign(funcionario, novosDados); // Atualiza os dados do funcionário
            let updateRequest = store.put(funcionario); // Alterar os dados do funcionário
            updateRequest.onsuccess = function () {
                console.log("Funcionário atualizado com sucesso!");
                mostrarFeedback("Dados atualizados com sucesso!", "success"); // Mostra feedback visual
                listarFuncionarios();
            };

            updateRequest.onerror = function (event) { // Alteração não realizada
                console.error("Erro ao atualizar funcionário:", event.target.error);
                mostrarFeedback("Erro ao atualizar funcionário!", "error"); // Exibe erro na interface
            };
        }
    };

    getRequest.onerror = function (event) { // Alteração não realizada
        console.error("Erro ao obter funcionário para atualização:", event.target.error);
        mostrarFeedback("Erro ao carregar funcionário para atualização!", "error"); // Feedback visual
    };
}

// Função para deletar um funcionário com feedback visual
function deletarFuncionario(id) { 
    let db = verificarDB();
    if (!db) return;

    let transaction = db.transaction("funcionarios", "readwrite");
    let store = transaction.objectStore("funcionarios");

    let deleteRequest = store.delete(id);
    deleteRequest.onsuccess = function () {
        console.log("Funcionário deletado com sucesso!");
        mostrarFeedback("Funcionário removido com sucesso!", "success"); // Exibe feedback visual
        listarFuncionarios(); // Atualiza a lista após remoção
    };

    deleteRequest.onerror = function (event) {
        console.error("Erro ao deletar funcionário:", event.target.error);
        mostrarFeedback("Erro ao remover funcionário!", "error"); // Mostra mensagem de erro
    };
}

// Mostrar feedback para o cliente de suas ações ao usar o sistema
function mostrarFeedback(mensagem, tipo) {
    let feedback = document.getElementById("feedback-msg");
    feedback.textContent = mensagem;
    feedback.className = `feedback ${tipo}`; // Aplica classe de sucesso ou erro
    feedback.style.display = "block";

    setTimeout(() => { // Função de tempo
        feedback.style.display = "none"; // Oculta após 3 segundos
    }, 3000);
}

// Chamada inicial para listar funcionários ao carregar a página
window.onload = listarFuncionarios;
