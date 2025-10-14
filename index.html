<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TricoMaster Analytics</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css">
    
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    fontFamily: { 'sans': ['Inter', 'sans-serif'], },
                    colors: {
                        'tm-verde': 'rgb(1, 52, 37)','tm-dourado': '#c5a365','tm-dourado-hover': '#b59355','tm-texto-principal': '#1F2937','tm-texto-secundario': '#6B7281','tm-bg': '#F3F4F6','tm-azul': '#2563EB','tm-azul-hover': '#1D4ED8','tm-bordo': '#800000',
                    }
                }
            }
        }
    </script>
    <style>
        body { font-family: 'Inter', sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
        .view { display: none; }
        .view.active { display: block; }
        .nav-link:hover { background-color: rgba(255, 255, 255, 0.1); }
        .nav-link-active, .nav-link-active:hover { background-color: #c5a365; color: white; }
        .report-table { width: 100%; border-collapse: collapse; font-size: 14px; }
        .report-table th, .report-table td { text-align: left; padding: 12px 8px; }
        .report-table thead tr { border-bottom: 2px solid #333; }
        .report-table tbody tr { border-bottom: 1px solid #ddd; }
        @media print {
            body * { visibility: hidden; }
            #view-relatorio, #view-relatorio * { visibility: visible; }
            #view-relatorio { position: absolute; left: 0; top: 0; width: 100%; }
            #relatorio-controls, #app-container header, .no-print { display: none !important; }
            .report-table { font-size: 11pt; width: 100%; border-collapse: collapse; }
            .report-table th, .report-table td { border: none; padding: 10px 4px; text-align: left; }
            .report-table thead tr { border-bottom: 2px solid #000; }
            .report-table tbody tr { border-bottom: 1px solid #ccc; }
            * { color: black !important; background: white !important; box-shadow: none !important; text-shadow: none !important; }
        }
    </style>

    <script src="https://www.gstatic.com/firebasejs/9.22.1/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.22.1/firebase-auth-compat.js"></script>

    <script>
      // CONFIGURAÇÃO DO FIREBASE COM SUAS CHAVES
      const firebaseConfig = {
        apiKey: "AIzaSyCrnH5pIHP87hZJHBXPLF9ds5I8-YWyaUI",
        authDomain: "lead-kommo.firebaseapp.com",
        projectId: "lead-kommo",
        storageBucket: "lead-kommo.appspot.com",
        messagingSenderId: "577017775201",
        appId: "1:577017775201:web:36ee01abbc4cbe02b89620"
      };
      
      // Inicializa o Firebase
      firebase.initializeApp(firebaseConfig);
    </script>

</head>
<body class="bg-tm-bg">

    <div id="login-container" class="flex items-center justify-center min-h-screen">
        <div class="w-full max-w-md bg-white p-8 rounded-lg shadow-lg">
            <div class="text-center mb-8">
                <h1 class="text-3xl font-bold text-tm-verde"><i class="fas fa-chart-line mr-2"></i>TricoMaster Analytics</h1>
                <p class="text-tm-texto-secundario mt-2">Faça o login para continuar</p>
            </div>
            
            <form id="login-form" class="space-y-6">
                <div>
                    <label for="email" class="block text-sm font-medium text-tm-texto-principal">E-mail</label>
                    <input type="email" id="email" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-tm-dourado focus:border-tm-dourado">
                </div>
                <div>
                    <label for="password" class="block text-sm font-medium text-tm-texto-principal">Senha</label>
                    <input type="password" id="password" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-tm-dourado focus:border-tm-dourado">
                </div>
                
                <p id="error-message" class="text-red-600 text-sm text-center h-4"></p>

                <div class="flex flex-col space-y-4">
                    <button type="submit" data-action="login" class="w-full bg-tm-verde text-white font-bold py-2 px-4 rounded-md hover:opacity-90 transition-opacity">
                        Entrar
                    </button>
                    <button type="button" data-action="signup" class="w-full bg-tm-dourado text-white font-bold py-2 px-4 rounded-md hover:bg-tm-dourado-hover transition-colors">
                        Criar Nova Conta
                    </button>
                </div>
            </form>
        </div>
    </div>

    <div id="app-container" style="display: none;">
        <header class="bg-tm-verde text-white shadow-lg sticky top-0 z-20 no-print">
            <div class="container mx-auto px-6 py-4 flex justify-between items-center">
                <h1 class="text-2xl font-bold"><i class="fas fa-chart-line mr-2"></i>TricoMaster Analytics</h1>
                
                <nav class="flex items-center space-x-4">
                    <div id="user-email" class="text-sm font-medium text-gray-200"></div>
                    <div class="flex-grow flex justify-center space-x-2">
                        <button data-action="navigate" data-view="metricas" class="nav-link px-4 py-2 rounded-md font-semibold transition-colors">Métricas</button>
                        <button data-action="navigate" data-view="comparativo" class="nav-link px-4 py-2 rounded-md font-semibold transition-colors">Comparativo</button>
                        <button data-action="navigate" data-view="gerenciar-leads" class="nav-link px-4 py-2 rounded-md font-semibold transition-colors">Gerenciar Leads</button>
                        <button data-action="navigate" data-view="analise-medicos" class="nav-link px-4 py-2 rounded-md font-semibold transition-colors">Análise de Médicos</button>
                        <button data-action="navigate" data-view="configuracoes" class="nav-link px-4 py-2 rounded-md font-semibold transition-colors">Configurações</button>
                    </div>
                    <button data-action="logout" class="bg-tm-bordo hover:opacity-80 text-white font-semibold py-2 px-4 rounded-md transition-colors">
                        <i class="fas fa-sign-out-alt mr-2"></i>Sair
                    </button>
                </nav>
            </div>
        </header>
        <main class="container mx-auto p-6">
            <div id="view-metricas" class="view active">
                <div class="flex justify-between items-center mb-4 no-print">
                    <h2 class="text-3xl font-bold text-tm-texto-principal">Métricas Principais</h2>
                    <button data-action="export-metricas-excel" class="bg-tm-verde hover:opacity-90 text-white font-bold py-2 px-4 rounded-md transition-colors">
                        <i class="fas fa-file-excel mr-2"></i>Exportar Métricas
                    </button>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6 p-4 bg-white rounded-lg shadow no-print">
                    <input type="date" id="dash-filtro-data-inicio" class="p-2 border rounded-md text-tm-texto-secundario font-medium">
                    <input type="date" id="dash-filtro-data-fim" class="p-2 border rounded-md text-tm-texto-secundario font-medium">
                    <select id="dash-filtro-unidade" class="p-2 border rounded-md text-tm-texto-secundario font-medium"></select>
                    <select id="dash-filtro-status" class="p-2 border rounded-md text-tm-texto-secundario font-medium"></select>
                    <select id="dash-filtro-origem" class="p-2 border rounded-md text-tm-texto-secundario font-medium"></select>
                </div>
                <div id="dashboard-kpis" class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-6 mb-6"></div>
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div id="chart-funil" class="bg-white p-6 rounded-lg shadow"></div>
                    <div id="chart-origem" class="bg-white p-6 rounded-lg shadow"></div>
                </div>
            </div>

            <div id="view-comparativo" class="view">
                <div class="flex justify-between items-center mb-6 no-print">
                    <h2 class="text-3xl font-bold text-tm-texto-principal">Dashboard Comparativo</h2>
                    <button data-action="export-comparativo-excel" class="bg-tm-verde hover:opacity-90 text-white font-bold py-2 px-4 rounded-md transition-colors">
                        <i class="fas fa-file-excel mr-2"></i>Exportar Comparativos
                    </button>
                </div>
                <div class="space-y-8">
                    <div class="bg-white p-6 rounded-lg shadow">
                        <h3 class="text-xl font-bold text-tm-texto-principal mb-4">Comparativo Semanal</h3>
                        <div class="mb-4 max-w-xs flex items-center space-x-4 no-print">
                             <label for="comp-semanal-mes" class="font-semibold text-tm-texto-secundario">Mês:</label>
                            <input type="month" id="comp-semanal-mes" class="p-2 border rounded-md w-full">
                        </div>
                        <div id="comparativo-semanal-content" class="overflow-x-auto"></div>
                    </div>
                    <div class="bg-white p-6 rounded-lg shadow">
                        <h3 class="text-xl font-bold text-tm-texto-principal mb-4">Comparativo Mês a Mês</h3>
                        <div class="flex space-x-4 mb-4 items-center no-print">
                            <label for="comp-mes1" class="font-semibold text-tm-texto-secundario">Mês 1:</label>
                            <input type="month" id="comp-mes1" class="p-2 border rounded-md">
                            <span class="font-bold text-xl">vs</span>
                            <label for="comp-mes2" class="font-semibold text-tm-texto-secundario">Mês 2:</label>
                            <input type="month" id="comp-mes2" class="p-2 border rounded-md">
                        </div>
                        <div id="comparativo-mes-a-mes-content" class="overflow-x-auto"></div>
                    </div>
                    <div class="bg-white p-6 rounded-lg shadow">
                        <h3 class="text-xl font-bold text-tm-texto-principal mb-4">Análise de Período (Arco)</h3>
                        <div class="flex space-x-4 mb-4 items-center no-print">
                            <label for="comp-arco-inicio" class="font-semibold text-tm-texto-secundario">De:</label>
                            <input type="date" id="comp-arco-inicio" class="p-2 border rounded-md">
                            <label for="comp-arco-fim" class="font-semibold text-tm-texto-secundario">Até:</label>
                            <input type="date" id="comp-arco-fim" class="p-2 border rounded-md">
                        </div>
                        <div id="comparativo-arco-content"></div>
                    </div>
                </div>
            </div>

            <div id="view-gerenciar-leads" class="view">
                <div class="flex justify-between items-center mb-4 no-print">
                    <h2 class="text-3xl font-bold text-tm-texto-principal">Gerenciar Leads</h2>
                    <div class="flex space-x-2">
                        <input type="file" id="import-excel-input" class="hidden" accept=".xlsx, .xls">
                        <button data-action="trigger-import" class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md transition-colors"><i class="fas fa-file-upload mr-2"></i>Importar Planilha</button>
                        <button data-action="export-excel" class="bg-gray-700 hover:bg-gray-800 text-white font-bold py-2 px-4 rounded-md transition-colors"><i class="fas fa-file-download mr-2"></i>Exportar Planilha</button>
                        <button data-action="open-lead-modal" class="bg-tm-dourado hover:bg-tm-dourado-hover text-white font-bold py-2 px-4 rounded-md transition-colors"><i class="fas fa-plus mr-2"></i>Adicionar Lead</button>
                    </div>
                </div>

                <div class="mb-4">
                     <input type="search" id="leads-filtro-busca" placeholder="🔎 Buscar por nome ou telefone..." class="w-full p-3 border rounded-lg shadow-sm font-medium text-tm-texto-secundario focus:ring-tm-dourado focus:border-tm-dourado">
                </div>
                 
                 <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-white rounded-lg shadow no-print">
                    <select id="leads-filtro-origem" class="p-2 border rounded-md font-medium text-tm-texto-secundario"></select>
                    <select id="leads-filtro-status" class="p-2 border rounded-md font-medium text-tm-texto-secundario"></select>
                    <select id="leads-filtro-unidade" class="p-2 border rounded-md font-medium text-tm-texto-secundario"></select>
                    <select id="leads-filtro-medico" class="p-2 border rounded-md font-medium text-tm-texto-secundario"></select>
                </div>
                <div class="bg-white p-6 rounded-lg shadow overflow-x-auto">
                    <table class="w-full text-left font-medium"><thead id="tabela-leads-head"></thead><tbody id="tabela-leads-body"></tbody></table>
                    <div id="leads-pagination" class="mt-6 flex justify-center items-center space-x-2 no-print"></div>
                </div>
                 <div class="mt-6 text-right no-print">
                    <button data-action="generate-report" class="bg-tm-azul hover:bg-tm-azul-hover text-white font-bold py-2 px-4 rounded-md transition-colors"><i class="fas fa-file-alt mr-2"></i>Gerar Relatório</button>
                </div>
            </div>
            
            <div id="view-analise-medicos" class="view">
                <h2 class="text-3xl font-bold text-tm-texto-principal mb-4">Análise de Performance dos Médicos</h2>
                <div class="flex space-x-4 mb-6 p-4 bg-white rounded-lg shadow no-print">
                    <input type="date" id="medicos-filtro-data-inicio" class="p-2 border rounded-md font-medium text-tm-texto-secundario">
                    <input type="date" id="medicos-filtro-data-fim" class="p-2 border rounded-md font-medium text-tm-texto-secundario">
                </div>
                <div id="medicos-performance-table" class="bg-white p-6 rounded-lg shadow overflow-x-auto"></div>
            </div>

            <div id="view-configuracoes" class="view">
                 <h2 class="text-3xl font-bold text-tm-texto-principal mb-6">Configurações</h2>
                 <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div class="bg-white p-6 rounded-lg shadow">
                        <h3 class="text-xl font-bold text-tm-texto-principal mb-4">Custos de Marketing Mensal</h3>
                        <form id="form-custos" class="space-y-4">
                            <input type="month" id="custo-mes" required class="w-full p-2 border rounded-md"><input type="number" id="custo-google" placeholder="Google Ads" class="w-full p-2 border rounded-md" min="0" step="0.01"><input type="number" id="custo-meta" placeholder="Meta Ads" class="w-full p-2 border rounded-md" min="0" step="0.01"><input type="number" id="custo-outros" placeholder="Outros" class="w-full p-2 border rounded-md" min="0" step="0.01"><button type="submit" class="w-full bg-tm-dourado hover:bg-tm-dourado-hover text-white font-bold py-2 px-4 rounded-md transition-colors">Salvar Custo</button>
                        </form>
                        <div id="lista-custos" class="mt-6 font-medium text-tm-texto-secundario"></div>
                    </div>
                    <div class="bg-white p-6 rounded-lg shadow">
                        <h3 class="text-xl font-bold text-tm-texto-principal mb-4">Cadastro de Médicos</h3>
                        <form id="form-medicos" class="flex space-x-2">
                             <input type="text" id="medico-nome" placeholder="Nome do Médico" required class="flex-grow p-2 border rounded-md"><input type="number" id="medico-consulta" placeholder="Valor da Consulta" required class="w-40 p-2 border rounded-md" min="0" step="0.01"><button type="submit" class="bg-tm-dourado hover:bg-tm-dourado-hover text-white font-bold py-2 px-4 rounded-md transition-colors">Adicionar</button>
                        </form>
                        <div id="lista-medicos" class="mt-6 font-medium text-tm-texto-secundario"></div>
                    </div>
                 </div>
            </div>
        </main>
    </div>
    
    <div id="modal-novo-lead" class="fixed inset-0 bg-black bg-opacity-60 hidden items-center justify-center p-4 no-print">
        <div class="bg-white rounded-lg shadow-2xl p-8 w-full max-w-lg">
            <h2 id="modal-title" class="text-2xl font-bold text-tm-texto-principal mb-6">Adicionar Novo Lead</h2>
            <form id="form-lead" class="space-y-4">
                <input type="hidden" id="lead-id">
                <input type="text" id="lead-nome" placeholder="Nome Completo" required class="w-full p-2 border rounded-md">
                <div>
                    <label for="lead-data" class="block text-sm font-medium text-tm-texto-secundario">Data de Criação</label>
                    <input type="date" id="lead-data" required class="w-full p-2 border rounded-md">
                </div>
                <input type="tel" id="lead-telefone" placeholder="Telefone" required class="w-full p-2 border rounded-md">
                <select id="lead-origem" required class="w-full p-2 border rounded-md"></select>
                <select id="lead-status" required class="w-full p-2 border rounded-md"></select>
                <select id="lead-medico" class="w-full p-2 border rounded-md"></select>
                <select id="lead-protocolo" required class="w-full p-2 border rounded-md"><option value="Não" selected>Protocolo Vendido: Não</option><option value="Sim">Protocolo Vendido: Sim</option></select>
                <select id="lead-unidade" required class="w-full p-2 border rounded-md"></select>
                <input type="number" id="lead-valor-protocolo" placeholder="Valor do Protocolo (R$)" class="w-full p-2 border rounded-md" min="0" step="0.01">
                <div class="flex justify-end space-x-4 pt-4">
                    <button type="button" data-action="close-lead-modal" class="bg-gray-200 hover:bg-gray-300 text-tm-texto-secundario font-bold py-2 px-6 rounded-md transition-colors">Cancelar</button><button type="submit" class="bg-tm-dourado hover:bg-tm-dourado-hover text-white font-bold py-2 px-6 rounded-md transition-colors">Salvar</button>
                </div>
            </form>
        </div>
    </div>

    <div id="view-relatorio" class="fixed inset-0 bg-white p-10 hidden z-50 overflow-y-auto">
        <div id="relatorio-controls" class="mb-6 flex justify-between items-center no-print">
            <h1 class="text-3xl font-bold text-tm-verde">Relatório de Leads</h1>
            <div>
                <button data-action="print-report" class="bg-tm-verde hover:opacity-90 text-white font-bold py-2 px-4 rounded-md mr-2"><i class="fas fa-print mr-2"></i>Imprimir</button><button data-action="close-report" class="bg-tm-texto-secundario hover:opacity-90 text-white font-bold py-2 px-4 rounded-md">Fechar</button>
            </div>
        </div>
        <div id="relatorio-conteudo"></div>
    </div>
    
    <script src="app.js"></script>
</body>
</html>
