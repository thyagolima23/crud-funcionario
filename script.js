// Inicializa o banco de dados
const request = indexedDB.open("FuncionariosDB", 1); //abertura da vesão 1 do banco de dados do indexedDB //banco de dados funcionáriosDB

request.onupgradeneeded = function (event) { //onupgradeneeded: evento de atualização, serve para atualizar versões
    let db = event.target.result; //retorna o banco de dado que está sendo criado ou atualizado
    let store = db.createObjectStore("funcionarios", { keyPath: "id", autoIncrement: true }); //cria um espaço onde os dados são armazenados
//store.crateIndex() cria um indice no objeto store, indices são usados para pesquisas e registros
    store.createIndex("nome", "nome", { unique: false });
    store.createIndex("cpf", "cpf", { unique: true });
    store.createIndex("email", "email", { unique: true });
    store.createIndex("telefone", "telefone", {unique: true});
    store.createIndex("cargo", "cargo", {unique: false});
    store.createIndex("data_nascimento", "data_nascimento", {unique: false});
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
    let funcionario = { //criar objeto funcionário, as palavras seguidas de dois pontos são atributos
        nome: document.getquerySelector("#nome").value,
        cpf: document.getquerySelector("#cpf").value,
        email: document.getquerySelector("#email").value,
        telefone: document.getquerySelector("#telefone").value,
        data_nascimento: document.getquerySelector("#data_nascimento").value,
        cargo: document.getquerySelector("#cargo").value
    };

    adicionarFuncionario(funcionario);
});


// Função para listar funcionários com feedback visual
function listarFuncionarios() {
    let db = verificarDB();
    if (!db) {
        mostrarFeedback("Erro ao carregar banco de dados!", "error");
        return;
    }

    let transaction = db.transaction("funcionarios", "readonly"); //faz leitura do Banco de funcionários
    let store = transaction.objectStore("funcionarios");

    let listaFuncionarios = document.querySelector(".your_dates"); //exibir lista no HTML
    listaFuncionarios.innerHTML = ""; // Limpa antes de exibir
    
    let cursorRequest = store.openCursor(); //É o jeito que o indexedDB usa para percorrer todos os registros dentro da Store "funcionarios"
    
    cursorRequest.onsuccess = function (event) { //lista executada com sucesso
        let cursor = event.target.result; //o cursor aponta para cada registro
        if (cursor) { //se o registro existir
            let funcionario = cursor.value; //o cursor busca as informações(valores) dos funcionários
            listaFuncionarios.innerHTML += `<p>ID: ${funcionario.id} - Nome: ${funcionario.nome} - CPF: ${funcionario.cpf}
            - E-mail: ${funcionario.email} - Telefone: ${funcionario.telefone} - Cargo: ${funcionario.cargo} - Data de nascimento: ${funcionario.data_nascimento} </p>`;
            cursor.continue();
        } else {
            mostrarFeedback("Lista de funcionários carregada com sucesso!", "success");
        }
    };

    cursorRequest.onerror = function (event) { //erro ao listar funcionários
        console.error("Erro ao listar funcionários:", event.target.error);
        mostrarFeedback("Erro ao listar funcionários!", "error");
    };
}

// Função para adicionar um funcionário com feedback visual
function adicionarFuncionario(funcionario) {
    let db = verificarDB(); //verificar o banco para ver se ele existe
    if (!db) return; //se estiver vazio sai da função

    let transaction = db.transaction("funcionarios", "readwrite"); //o readwrite permite gerir(crud) os dados
    let store = transaction.objectStore("funcionarios"); //referência direta de onde os dados serão armazenados
    
    let addRequest = store.add(funcionario); //adicionando funcionário na store
    addRequest.onsuccess = function () { //funcionário adicionado com sucesso
        console.log("Funcionário adicionado com sucesso!");
        mostrarFeedback("Funcionário cadastrado com sucesso!", "success"); // Mostra feedback visual
        listarFuncionarios(); //chama a função listar funcionário
    };

    addRequest.onerror = function (event) { //erro ao adicionar funcionário
        console.error("Erro ao adicionar funcionário:", event.target.error);
        mostrarFeedback("Erro ao cadastrar funcionário!", "error"); // Exibe erro na interface
    };
}


// Função para atualizar um funcionário com feedback visual
function atualizarFuncionario(id, novosDados) { //o id é pra informar o n° do registro do funcionário e o novosDados para alterar a informação desejada
    let db = verificarDB();
    if (!db) return;

    let transaction = db.transaction("funcionarios", "readwrite");
    let store = transaction.objectStore("funcionarios");

    let getRequest = store.get(id); //pega o número(id) do funcionário do banco de Dados
    getRequest.onsuccess = function () { //obteve sucesso ao achar a ID do funcionário
        let funcionario = getRequest.result;
        if (funcionario) {
            Object.assign(funcionario, novosDados); // Atualiza os dados do funcionário
            let updateRequest = store.put(funcionario); //alterar os dados do funcionário
            updateRequest.onsuccess = function () {
                console.log("Funcionário atualizado com sucesso!");
                mostrarFeedback("Dados atualizados com sucesso!", "success"); // Mostra feedback visual
                listarFuncionarios();
            };

            updateRequest.onerror = function (event) { //alteração não realizada
                console.error("Erro ao atualizar funcionário:", event.target.error);
                mostrarFeedback("Erro ao atualizar funcionário!", "error"); // Exibe erro na interface
            };
        }
    };

    getRequest.onerror = function (event) { //alteração não realizada
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

    setTimeout(() => { //função de tempo
        feedback.style.display = "none"; // Oculta após 3 segundos
    }, 3000);
}



// Chamada inicial para listar funcionários ao carregar a página
window.onload = listarFuncionarios;