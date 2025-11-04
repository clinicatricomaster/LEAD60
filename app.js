const app = {
    db: firebase.firestore(),
    auth: firebase.auth(),
    listenersAttached: false,

    data: {
        leads: [],
        medicos: [],
        custos: [],
        origens: [], // Lista de origens agora é dinâmica
    },
    state: {
        currentView: 'metricas',
        editingLeadId: null,
        leadsPage: 1,
        leadsRowsPerPage: 10,
    },
    // ATUALIZADO: "Qualificação" removida
    FUNIL_STATUS: ['Lead de Entrada', 'Primeiro Contato', 'Agendamento', 'Consulta Realizada', 'Protocolo Venda', 'Não Compareceu', 'Perdido'],
    // ATUALIZADO: "Qualificação" removida, "Perdido" readicionado
    FUNIL_STATUS_DISPLAY: ['Lead de Entrada', 'Primeiro Contato', 'Agendamento', 'Consulta Realizada', 'Não Compareceu', 'Perdido'],
    // REMOVIDO: A constante ORIGENS foi removida, agora é this.data.origens
    UNIDADES: ['Tatuapé', 'Santana'],
    PROTOCOLOS: ['Sim', 'Não'],

    init() {
        const loginContainer = document.getElementById('login-container');
        const appContainer = document.getElementById('app-container');

        this.setupLoginListeners(); 

        this.auth.onAuthStateChanged(async (user) => {
            if (user) {
                // Usuário está logado
                loginContainer.style.display = 'none';
                appContainer.style.display = 'block';
                document.getElementById('user-email-desktop').textContent = user.email;
                document.getElementById('user-email-mobile').textContent = user.email;

                await this.loadDataFromFirebase();
                
                // Configura os listeners do dashboard APENAS depois do login
                this.setupDashboardListeners();
                this.showView('metricas');

            } else {
                // Usuário não está logado
                appContainer.style.display = 'none';
                loginContainer.style.display = 'flex';
                this.listenersAttached = false; 
            }
        });
    },

    async loadDataFromFirebase() {
        try {
            const leadsSnapshot = await this.db.collection('leads').orderBy('dataCriacao', 'desc').get();
            this.data.leads = leadsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            const medicosSnapshot = await this.db.collection('medicos').orderBy('nome').get();
            this.data.medicos = medicosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            const custosSnapshot = await this.db.collection('custos').orderBy('mes', 'desc').get();
            this.data.custos = custosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            // ATUALIZADO: Popula a lista de origens dinamicamente
            const origensUnicas = [...new Set(this.data.leads.map(lead => lead.origem || 'Outros'))];
            this.data.origens = origensUnicas.sort();

        } catch (error) {
            console.error("ERRO CRÍTICO AO CARREGAR DADOS DO FIREBASE:", error);
            alert(`Não foi possível carregar os dados. Verifique o console (F12) para detalhes do erro. Pode ser necessário criar um Índice no Firestore.`);
        }
    },
    
    toTitleCase(str) {
        if (!str) return '';
        return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    },

    getRawDigits(phoneString) {
        if (!phoneString || typeof phoneString !== 'string') return '';
        return phoneString.replace(/\D/g, '');
    },
    
    setupLoginListeners() {
        const loginForm = document.getElementById('login-form');
        if (loginForm && !loginForm.dataset.listenerAttached) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
            
            const signupButton = document.querySelector('[data-action="signup"]');
            signupButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleSignup();
            });

            loginForm.dataset.listenerAttached = 'true';
        }
    },

    async handleLogin() {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const errorMessage = document.getElementById('error-message');
        errorMessage.textContent = 'Autenticando...';
        try {
            await this.auth.signInWithEmailAndPassword(email, password);
            errorMessage.textContent = '';
        } catch (error) {
            errorMessage.textContent = "E-mail ou senha inválidos.";
            console.error("Erro de login:", error);
        }
    },

    async handleSignup() {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const errorMessage = document.getElementById('error-message');
        errorMessage.textContent = 'Criando conta...';

        if (password.length < 6) {
            errorMessage.textContent = "A senha deve ter pelo menos 6 caracteres.";
            return;
        }
        try {
            await this.auth.createUserWithEmailAndPassword(email, password);
            errorMessage.textContent = '';
        } catch (error) {
            errorMessage.textContent = error.code === 'auth/email-already-in-use' ? "Este e-mail já está em uso." : "Erro ao criar conta.";
            console.error("Erro ao criar conta:", error);
        }
    },

    setupDashboardListeners() {
        if (this.listenersAttached) return;

        const mobileMenuButton = document.getElementById('mobile-menu-button');
        const mobileMenu = document.getElementById('mobile-menu');
        
        if (mobileMenuButton && mobileMenu) {
            mobileMenuButton.addEventListener('click', () => mobileMenu.classList.toggle('hidden'));
            mobileMenu.addEventListener('click', (e) => {
                if (e.target.closest('[data-action]')) {
                    mobileMenu.classList.add('hidden');
                }
            });
        }

        document.body.addEventListener('click', async (e) => {
            const actionTarget = e.target.closest('[data-action]');
            if (!actionTarget) return;

            const action = actionTarget.dataset.action;
            if (['login', 'signup'].includes(action)) return;

            const id = actionTarget.dataset.id;
            
            switch (action) {
                case 'navigate': this.showView(actionTarget.dataset.view); break;
                case 'open-lead-modal': this.openLeadModal(id); break;
                case 'close-lead-modal': this.closeLeadModal(); break;
                case 'logout': if (confirm('Tem certeza que deseja sair?')) await this.auth.signOut(); break;
                case 'delete-lead':
                    if (confirm('Tem certeza?')) {
                        try {
                            await this.db.collection('leads').doc(id).delete();
                            this.data.leads = this.data.leads.filter(l => l.id !== id);
                            this.renderGerenciarLeads();
                        } catch (error) { console.error("Erro ao deletar lead:", error); alert(`Falha ao deletar o lead. Erro: ${error.message}`); }
                    }
                    break;
                case 'delete-medico':
                    if (confirm('Tem certeza?')) {
                        try {
                            await this.db.collection('medicos').doc(id).delete();
                            this.data.medicos = this.data.medicos.filter(m => m.id !== id);
                            this.renderConfiguracoes();
                        } catch (error) { console.error("Erro ao deletar médico:", error); alert(`Falha ao deletar o médico. Erro: ${error.message}`); }
                    }
                    break;
                case 'delete-custo':
                     if (confirm('Tem certeza?')) {
                        try {
                            const custoToDelete = this.data.custos.find(c => c.mes === actionTarget.dataset.mes);
                            if (custoToDelete) {
                                await this.db.collection('custos').doc(custoToDelete.id).delete();
                                this.data.custos = this.data.custos.filter(c => c.id !== custoToDelete.id);
                                this.renderConfiguracoes();
                            }
                        } catch (error) { console.error("Erro ao deletar custo:", error); alert(`Falha ao deletar o custo. Erro: ${error.message}`); }
                    }
                    break;
                case 'trigger-import': document.getElementById('import-excel-input').click(); break;
                case 'export-excel': this.exportToExcel(); break;
                case 'generate-report': this.renderReport(); break;
                case 'print-report': window.print(); break;
                case 'close-report': document.getElementById('view-relatorio').classList.add('hidden'); break;
                case 'change-page': 
                    this.state.leadsPage = parseInt(actionTarget.dataset.page, 10);
                    this.renderGerenciarLeads();
                    break;
                case 'export-metricas-excel': this.exportarMetricasParaExcel(); break;
                case 'export-comparativo-excel': this.exportarComparativosParaExcel(); break;
                case 'clear-leads-filters': this.clearLeadsFilters(); break;
            }
        });

        const safeAddEventListener = (id, event, handler) => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener(event, handler);
            }
        };

        safeAddEventListener('import-excel-input', 'change', e => this.importFromExcel(e));
        safeAddEventListener('form-lead', 'submit', e => { e.preventDefault(); this.saveLead(); });
        safeAddEventListener('form-medicos', 'submit', e => { e.preventDefault(); this.saveMedico(); });
        safeAddEventListener('form-custos', 'submit', e => { e.preventDefault(); this.saveCusto(); });
        
        safeAddEventListener('tabela-leads-body', 'change', async (e) => {
            const target = e.target;
            if (target.dataset.quickEdit) {
                const leadId = target.dataset.id;
                const field = target.dataset.field;
                const value = target.value;
                const lead = this.data.leads.find(l => l.id === leadId);
                if (lead) {
                    lead[field] = value;
                    const updateData = { [field]: value };
                    if (field === 'status' && value === 'Protocolo Venda') {
                        lead.protocoloVendido = 'Sim';
                        updateData.protocoloVendido = 'Sim';
                    }
                    try {
                        await this.db.collection('leads').doc(leadId).update(updateData);
                        if (field === 'status' && value === 'Protocolo Venda') {
                            this.renderGerenciarLeads();
                            this.openLeadModal(leadId);
                        }
                    } catch (error) { console.error("Erro ao atualizar lead:", error); alert(`Não foi possível salvar a alteração rápida. Erro: ${error.message}`); }
                }
            }
        });
        
        safeAddEventListener('leads-filtro-busca', 'input', () => {
            this.state.leadsPage = 1;
            this.renderGerenciarLeads();
        });

        const filters = [
            'dash-filtro-data-inicio', 'dash-filtro-data-fim', 'dash-filtro-unidade', 'dash-filtro-status', 'dash-filtro-origem', 
            'leads-filtro-data-inicio', 'leads-filtro-data-fim', 
            'leads-filtro-origem', 'leads-filtro-status', 'leads-filtro-unidade', 'leads-filtro-medico',
            'leads-filtro-protocolo',
            'medicos-filtro-data-inicio', 'medicos-filtro-data-fim'
        ];
        filters.forEach(id => {
            safeAddEventListener(id, 'change', () => { 
                this.state.leadsPage = 1; 
                this.showView(this.state.currentView); 
            });
        });
        
        safeAddEventListener('comp-mes1', 'change', () => this.renderCompMesAMes());
        safeAddEventListener('comp-mes2', 'change', () => this.renderCompMesAMes());
        safeAddEventListener('comp-arco-inicio', 'change', () => this.renderCompArco());
        safeAddEventListener('comp-arco-fim', 'change', () => this.renderCompArco());
        safeAddEventListener('comp-semanal-mes', 'change', () => this.renderCompSemanal());
        
        this.listenersAttached = true;
    },

    showView(viewId) { if (!document.getElementById(`view-${viewId}`)) return; if (this.state.currentView !== viewId) { this.state.leadsPage = 1; } this.state.currentView = viewId; document.querySelectorAll('.view').forEach(view => view.classList.remove('active')); document.getElementById(`view-${viewId}`).classList.add('active'); this.updateNavLinks(); const renderFunctions = { 'metricas': () => this.renderMetricas(), 'comparativo': () => this.renderComparativo(), 'gerenciar-leads': () => this.renderGerenciarLeads(), 'analise-medicos': () => this.renderAnaliseMedicos(), 'configuracoes': () => this.renderConfiguracoes(), }; if(renderFunctions[viewId]) { renderFunctions[viewId](); } },
    updateNavLinks() { document.querySelectorAll('.nav-link').forEach(link => { link.classList.remove('nav-link-active'); if (link.dataset.view === this.state.currentView) { link.classList.add('nav-link-active'); } }); },
    async saveLead() { const id = document.getElementById('lead-id').value; const dateValue = document.getElementById('lead-data').value; const dateObject = new Date(dateValue); const finalDate = new Date(dateObject.getUTCFullYear(), dateObject.getUTCMonth(), dateObject.getUTCDate()).toISOString(); const leadData = { nome: this.toTitleCase(document.getElementById('lead-nome').value), telefone: document.getElementById('lead-telefone').value, origem: document.getElementById('lead-origem').value, status: document.getElementById('lead-status').value, medico: document.getElementById('lead-medico').value, unidade: document.getElementById('lead-unidade').value, protocoloVendido: document.getElementById('lead-protocolo').value, valorProtocolo: parseFloat(document.getElementById('lead-valor-protocolo').value) || 0, dataCriacao: finalDate, }; try { if (id) { await this.db.collection('leads').doc(id).update(leadData); const index = this.data.leads.findIndex(l => l.id === id); if (index > -1) this.data.leads[index] = { ...this.data.leads[index], ...leadData }; } else { const docRef = await this.db.collection('leads').add(leadData); this.data.leads.push({ id: docRef.id, ...leadData }); } this.data.leads.sort((a, b) => new Date(b.dataCriacao) - new Date(a.dataCriacao)); this.closeLeadModal(); this.clearLeadsFilters(); this.showView('gerenciar-leads'); } catch (error) { console.error("Erro ao salvar lead:", error); alert(`Não foi possível salvar o lead. Erro: ${error.message}`); } },
    async saveMedico() { const nome = this.toTitleCase(document.getElementById('medico-nome').value); const valorConsulta = parseFloat(document.getElementById('medico-consulta').value); if (nome && valorConsulta >= 0) { const medicoData = { nome, valorConsulta }; try { const docRef = await this.db.collection('medicos').add(medicoData); this.data.medicos.push({ id: docRef.id, ...medicoData }); this.data.medicos.sort((a, b) => a.nome.localeCompare(b.nome)); this.renderConfiguracoes(); document.getElementById('form-medicos').reset(); } catch (error) { console.error("Erro ao salvar médico:", error); alert(`Não foi possível salvar o médico. Erro: ${error.message}`); } } },
    async saveCusto() { const mes = document.getElementById('custo-mes').value; const custoData = { mes, google: parseFloat(document.getElementById('custo-google').value) || 0, meta: parseFloat(document.getElementById('custo-meta').value) || 0, outros: parseFloat(document.getElementById('custo-outros').value) || 0, }; const existing = this.data.custos.find(c => c.mes === mes); try { if (existing) { await this.db.collection('custos').doc(existing.id).update(custoData); const index = this.data.custos.findIndex(c => c.id === existing.id); this.data.custos[index] = { ...existing, ...custoData }; } else { const docRef = await this.db.collection('custos').add(custoData); this.data.custos.push({ id: docRef.id, ...custoData }); } this.data.custos.sort((a,b) => b.mes.localeCompare(a.mes)); this.renderConfiguracoes(); document.getElementById('form-custos').reset(); } catch (error) { console.error("Erro ao salvar custo:", error); alert(`Não foi possível salvar o custo. Erro: ${error.message}`); } },
    converterDataKommo(dataString) { if (!dataString || typeof dataString !== 'string') return new Date().toISOString(); try { const parteData = dataString.split(' ')[0]; const [dia, mes, ano] = parteData.split('.').map(Number); if (isNaN(dia) || isNaN(mes) || isNaN(ano)) { throw new Error("Formato de data inválido"); } return new Date(ano, mes - 1, dia).toISOString(); } catch (e) { console.error(`Erro ao converter data: "${dataString}". Usando data atual.`, e); return new Date().toISOString(); } },
    converterTelefoneKommo(telefoneString) { if (!telefoneString || typeof telefoneString !== 'string') return ''; let digitos = this.getRawDigits(telefoneString); if (digitos.startsWith('55') && digitos.length > 11) { digitos = digitos.substring(2); } if (digitos.length === 11) { return digitos.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3'); } if (digitos.length === 10) { return digitos.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3'); } return telefoneString; },
    
    async importFromExcel(event) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const importedData = XLSX.utils.sheet_to_json(worksheet);
                if (importedData.length === 0) { alert("A planilha selecionada está vazia."); return; }
                if (!importedData[0] || importedData[0]["Contato principal"] === undefined || importedData[0]["Etapa do lead"] === undefined) { alert("Erro: A planilha não parece ser o modelo correto. Colunas como 'Contato principal' ou 'Etapa do lead' não foram encontradas."); event.target.value = ''; return; }
                
                const existingPhonesSet = new Set(this.data.leads.map(lead => this.getRawDigits(lead.telefone)));
                const batch = this.db.batch();
                const newLeadsForState = [];
                let duplicados = 0;
                let adicionados = 0;

                importedData.forEach(linha => {
                    const newPhoneFormatted = this.converterTelefoneKommo(String(linha["Telefone comercial (contato)"] || ''));
                    const newPhoneRaw = this.getRawDigits(newPhoneFormatted);
                    if (newPhoneRaw && existingPhonesSet.has(newPhoneRaw)) {
                        duplicados++;
                    } else {
                        adicionados++;
                        const newLead = {
                            nome: this.toTitleCase(linha["Contato principal"]) || 'Sem nome',
                            dataCriacao: this.converterDataKommo(linha["Data Criada"]),
                            telefone: newPhoneFormatted,
                            status: linha["Etapa do lead"] || 'Lead de Entrada',
                            origem: linha["Lead tags"] || 'Outros',
                            medico: this.toTitleCase(linha["Nota 1"]) || '',
                            unidade: this.toTitleCase(linha["Nota 2"]) || '',
                            protocoloVendido: linha["Nota 3"] || 'Não',
                            valorProtocolo: parseFloat(linha["Nota 4"]) || 0,
                        };
                        const docRef = this.db.collection('leads').doc();
                        batch.set(docRef, newLead);
                        newLeadsForState.push({ id: docRef.id, ...newLead });
                        if (newPhoneRaw) { existingPhonesSet.add(newPhoneRaw); }
                    }
                });

                if (adicionados > 0) {
                    await batch.commit();
                    this.data.leads.push(...newLeadsForState);
                    this.data.leads.sort((a, b) => new Date(b.dataCriacao) - new Date(a.dataCriacao));
                    // ATUALIZADO: Limpa os filtros para que os novos leads apareçam
                    this.clearLeadsFilters();
                    this.renderGerenciarLeads();
                }
                
                alert(`Importação concluída!\n\nLeads Adicionados: ${adicionados}\nLeads Duplicados (ignorados): ${duplicados}`);
                
            } catch (error) {
                console.error("Erro ao importar a planilha:", error);
                alert("Ocorreu um erro ao processar o arquivo.");
            } finally {
                event.target.value = '';
            }
        };
        reader.readAsArrayBuffer(file);
    },

    exportToExcel() { if (this.data.leads.length === 0) { alert("Não há leads para exportar."); return; } const dataToExport = this.data.leads.map(lead => ({ "Contato principal": lead.nome, "Telefone comercial (contato)": lead.telefone, "Data Criada": new Date(lead.dataCriacao).toLocaleString('pt-BR'), "Etapa do lead": lead.status, "Lead tags": lead.origem, "Nota 1": lead.medico, "Nota 2": lead.unidade, "Nota 3": lead.protocoloVendido, "Nota 4": lead.valorProtocolo, })); const worksheet = XLSX.utils.json_to_sheet(dataToExport); const workbook = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(workbook, worksheet, "Leads"); const fileName = `TricoMaster_Leads_Export_${new Date().toISOString().split('T')[0]}.xlsx`; XLSX.writeFile(workbook, fileName); },
    exportarMetricasParaExcel() { const filters = this.getFilters('dash'); const filteredLeads = this.filterLeads(filters); const kpis = this.calculateKPIs(filteredLeads, filters); const kpiData = [["Métrica", "Valor"], ["Total de Leads", kpis.totalLeads], ["Consultas Agendadas", kpis.consultasAgendadas], ["Consultas Realizadas", kpis.consultasRealizadas], ["Protocolos Vendidos", kpis.protocolosVendidos], ["CPL", this.formatCurrency(kpis.cpl)], ["CPA", this.formatCurrency(kpis.cpa)], ["Faturamento", this.formatCurrency(kpis.faturamento)]]; const funilData = [["Estágio do Funil", "Quantidade"]]; const leadsParaFunil = filteredLeads.map(lead => lead.status === 'Protocolo Venda' ? { ...lead, status: 'Consulta Realizada' } : lead); const statusParaFunil = this.FUNIL_STATUS_DISPLAY; statusParaFunil.forEach(status => { const count = leadsParaFunil.filter(lead => lead.status === status).length; funilData.push([status, count]); }); const origemData = [["Origem", "Quantidade"]]; this.data.origens.forEach(origem => { const count = filteredLeads.filter(lead => lead.origem === origem).length; origemData.push([origem, count]); }); const workbook = XLSX.utils.book_new(); const wsKPIs = XLSX.utils.aoa_to_sheet(kpiData); const wsFunil = XLSX.utils.aoa_to_sheet(funilData); const wsOrigem = XLSX.utils.aoa_to_sheet(origemData); XLSX.utils.book_append_sheet(workbook, wsKPIs, "KPIs Principais"); XLSX.utils.book_append_sheet(workbook, wsFunil, "Funil de Vendas"); XLSX.utils.book_append_sheet(workbook, wsOrigem, "Leads por Origem"); const dataFim = filters.dataFim ? filters.dataFim.toISOString().split('T')[0] : 'geral'; XLSX.writeFile(workbook, `TricoMaster_Metricas_${dataFim}.xlsx`); },
    exportarComparativosParaExcel() { const workbook = XLSX.utils.book_new(); const mes1ISO = document.getElementById('comp-mes1').value; const mes2ISO = document.getElementById('comp-mes2').value; if (mes1ISO && mes2ISO) { const metricaMes1 = this.getMetricsForLeads(this.data.leads.filter(l => l.dataCriacao.startsWith(mes1ISO))); const metricaMes2 = this.getMetricsForLeads(this.data.leads.filter(l => l.dataCriacao.startsWith(mes2ISO))); const mesAMesData = [["Métrica", mes1ISO, mes2ISO]]; mesAMesData.push(["Total de Leads", metricaMes1.totalLeads, metricaMes2.totalLeads]); mesAMesData.push(["Consultas Realizadas", metricaMes1.consultasRealizadas, metricaMes2.consultasRealizadas]); mesAMesData.push(["Protocolos Vendidos", metricaMes1.protocolosVendidos, metricaMes2.protocolosVendidos]); mesAMesData.push(["Faturamento", this.formatCurrency(metricaMes1.faturamento), this.formatCurrency(metricaMes2.faturamento)]); mesAMesData.push([]); mesAMesData.push(["Funil de Vendas"]); this.FUNIL_STATUS_DISPLAY.forEach(status => { mesAMesData.push([status, metricaMes1.funil[status], metricaMes2.funil[status]]); }); const wsMesAMes = XLSX.utils.aoa_to_sheet(mesAMesData); XLSX.utils.book_append_sheet(workbook, wsMesAMes, "Mês a Mês"); } const mesSemanalISO = document.getElementById('comp-semanal-mes').value; if (mesSemanalISO) { const [ano, mes] = mesSemanalISO.split('-').map(Number); const getLeadsNaSemana = (semana) => { const dias = { 1: [1, 7], 2: [8, 14], 3: [15, 21], 4: [22, 31] }; return this.data.leads.filter(lead => { const dataLead = new Date(lead.dataCriacao); const dia = dataLead.getDate(); return dataLead.getFullYear() === ano && dataLead.getMonth() + 1 === mes && (dia >= dias[semana][0] && dia <= dias[semana][1]); }); }; const semanas = [1, 2, 3, 4].map(s => this.getMetricsForLeads(getLeadsNaSemana(s))); const semanalData = [["Métrica", "Semana 1", "Semana 2", "Semana 3", "Semana 4"]]; semanalData.push(["Total Leads", semanas[0].totalLeads, semanas[1].totalLeads, semanas[2].totalLeads, semanas[3].totalLeads]); semanalData.push(["Faturamento", this.formatCurrency(semanas[0].faturamento), this.formatCurrency(semanas[1].faturamento), this.formatCurrency(semanas[2].faturamento), this.formatCurrency(semanas[3].faturamento)]); semanalData.push([]); semanalData.push(["Funil de Vendas"]); this.FUNIL_STATUS_DISPLAY.forEach(status => { semanalData.push([status, semanas[0].funil[status], semanas[1].funil[status], semanas[2].funil[status], semanas[3].funil[status]]); }); const wsSemanal = XLSX.utils.aoa_to_sheet(semanalData); XLSX.utils.book_append_sheet(workbook, wsSemanal, "Semanal " + mesSemanalISO); } XLSX.writeFile(workbook, `TricoMaster_Comparativos_${new Date().toISOString().split('T')[0]}.xlsx`); },
    
    // ATUALIZADO: Lógica de funil agora agrupa "Qualificação" em "Primeiro Contato"
    getMetricsForLeads(leadsArray) {
        if (!leadsArray) leadsArray = [];
        const { faturamento, consultasAgendadas, consultasRealizadas, protocolosVendidos } = this.calculateKPIs(leadsArray, {});
        
        const funilCalcs = this.FUNIL_STATUS_DISPLAY.reduce((acc, status) => ({ ...acc, [status]: 0 }), {});
        const origensCalcs = {};

        leadsArray.forEach(lead => {
            let status = lead.status;
            if (status === 'Qualificação') status = 'Primeiro Contato';
            if (status === 'Protocolo Venda') status = 'Consulta Realizada';
            
            if (funilCalcs[status] !== undefined) {
                funilCalcs[status]++;
            }

            const origem = lead.origem || 'Outros';
            if (!origensCalcs[origem]) origensCalcs[origem] = 0;
            origensCalcs[origem]++;
        });

        return { totalLeads: leadsArray.length, consultasAgendadas, consultasRealizadas, protocolosVendidos, faturamento, funil: funilCalcs, origens: origensCalcs };
    },

    calculateKPIs(leads, filters) { const totalLeads = leads.length; const consultasAgendadas = leads.filter(l => ['Agendamento', 'Consulta Realizada', 'Protocolo Venda', 'Não Compareceu'].includes(l.status)).length; const consultasRealizadas = leads.filter(l => ['Consulta Realizada', 'Protocolo Venda'].includes(l.status)).length; const startMonth = filters.dataInicio ? filters.dataInicio.toISOString().substring(0, 7) : null; const endMonth = filters.dataFim ? filters.dataFim.toISOString().substring(0, 7) : null; const custoTotal = this.data.custos.filter(c => (!startMonth || c.mes >= startMonth) && (!endMonth || c.mes <= endMonth)).reduce((sum, c) => sum + (c.google || 0) + (c.meta || 0) + (c.outros || 0), 0); const protocolosVendidos = leads.filter(l => l.protocoloVendido === 'Sim').length; const cpl = totalLeads > 0 ? custoTotal / totalLeads : 0; const cpa = consultasRealizadas > 0 ? custoTotal / consultasRealizadas : 0; const faturamentoProtocolos = leads.filter(l => l.protocoloVendido === 'Sim').reduce((sum, l) => sum + (l.valorProtocolo || 0), 0); const faturamentoConsultas = leads.filter(l => ['Consulta Realizada', 'Protocolo Venda'].includes(l.status) && l.medico).reduce((sum, l) => { const medico = this.data.medicos.find(m => m.nome === l.medico); return sum + (medico ? medico.valorConsulta : 0); }, 0); const faturamento = faturamentoProtocolos + faturamentoConsultas; return { totalLeads, faturamento, consultasAgendadas, consultasRealizadas, protocolosVendidos, cpl, cpa }; },
    
    filterLeads(filters) {
        const termoBusca = filters.busca ? filters.busca.trim().toLowerCase() : '';
        const termoBuscaNumeros = termoBusca.replace(/\D/g, '');

        return this.data.leads.filter(lead => {
            if (lead.dataCriacao) { 
                const leadDate = new Date(lead.dataCriacao);
                if (filters.dataInicio && leadDate < filters.dataInicio) {
                    return false;
                }
                if (filters.dataFim && leadDate > filters.dataFim) {
                    return false;
                }
            } else if (filters.dataInicio || filters.dataFim) {
                return false;
            }
            if (termoBusca) {
                const nomeLead = lead.nome ? lead.nome.toLowerCase() : '';
                const telefoneLead = lead.telefone ? this.getRawDigits(lead.telefone) : '';
                const nomeMatch = nomeLead.includes(termoBusca);
                const telefoneMatch = termoBuscaNumeros.length > 0 && telefoneLead.includes(termoBuscaNumeros);
                if (!nomeMatch && !telefoneMatch) {
                    return false;
                }
            }
            if (filters.unidade && lead.unidade !== filters.unidade) return false;
            if (filters.origem && lead.origem !== filters.origem) return false;
            if (filters.status && lead.status !== filters.status) return false;
            if (filters.medico && lead.medico !== filters.medico) return false;
            if (filters.protocolo && lead.protocoloVendido !== filters.protocolo) return false;
            
            return true;
        });
    },

    formatCurrency(value) { return value != null ? value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00'; },
    
    getFilters(prefix) {
        const data = {
            dataInicio: document.getElementById(`${prefix}-filtro-data-inicio`)?.value ? new Date(`${document.getElementById(`${prefix}-filtro-data-inicio`).value}T00:00:00`) : null,
            dataFim: document.getElementById(`${prefix}-filtro-data-fim`)?.value ? new Date(`${document.getElementById(`${prefix}-filtro-data-fim`).value}T23:59:59`) : null,
            unidade: document.getElementById(`${prefix}-filtro-unidade`)?.value || null,
            origem: document.getElementById(`${prefix}-filtro-origem`)?.value || null,
            status: document.getElementById(`${prefix}-filtro-status`)?.value || null,
            medico: document.getElementById(`${prefix}-filtro-medico`)?.value || null,
        };
        if (prefix === 'leads') {
            data.busca = document.getElementById('leads-filtro-busca')?.value || null;
            data.protocolo = document.getElementById('leads-filtro-protocolo')?.value || null;
        }
        return data;
    },

    // ATUALIZADO: Popula o filtro de "Origem" dinamicamente
    populateFilters(prefix) {
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
        const startDateInput = document.getElementById(`${prefix}-filtro-data-inicio`);
        if (startDateInput && !startDateInput.value) startDateInput.value = firstDay;
        const endDateInput = document.getElementById(`${prefix}-filtro-data-fim`);
        if (endDateInput && !endDateInput.value) endDateInput.value = lastDay;
        
        if (document.getElementById(`${prefix}-filtro-unidade`)) this.populateSelect(`${prefix}-filtro-unidade`, this.UNIDADES, true, "Todas Unidades");
        if (document.getElementById(`${prefix}-filtro-origem`)) this.populateSelect(`${prefix}-filtro-origem`, this.data.origens, true, "Todas Origens");
        if (document.getElementById(`${prefix}-filtro-status`)) this.populateSelect(`${prefix}-filtro-status`, this.FUNIL_STATUS, true, "Todos Status");
        if (document.getElementById(`${prefix}-filtro-medico`)) this.populateSelect(`${prefix}-filtro-medico`, this.data.medicos.map(m => m.nome), true, "Todos Médicos");
        
        if (prefix === 'leads') {
             if (document.getElementById(`leads-filtro-protocolo`)) this.populateSelect(`leads-filtro-protocolo`, this.PROTOCOLOS, true, "Protocolo (Todos)");
        }
    },

    populateSelect(elementId, options, withAllOption, allOptionText) { const select = document.getElementById(elementId); if (!select) return; const currentValue = select.value; select.innerHTML = ''; if (withAllOption) { const option = document.createElement('option'); option.value = ''; option.innerText = allOptionText; select.appendChild(option); } options.forEach(opt => { const option = document.createElement('option'); option.value = opt; option.innerText = opt; select.appendChild(option); }); if (options.includes(currentValue)) { select.value = currentValue; } },
    renderChart(elementId, title, categories, data, field, barColorClass) { const container = document.getElementById(elementId); if(!container) return; const total = data.filter(item => categories.includes(item[field])).length; let chartHTML = `<h3 class="text-xl font-semibold text-tm-texto-principal mb-4">${title}</h3><div class="space-y-3">`; categories.forEach(category => { const count = data.filter(item => item[field] === category).length; const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : 0; chartHTML += `<div class="w-full"><div class="flex justify-between mb-1 text-sm font-medium text-tm-texto-secundario"><span>${category}</span><span>${count} (${percentage}%)</span></div><div class="bg-gray-200 rounded-full h-2.5"><div class="${barColorClass} h-2.5 rounded-full" style="width: ${percentage}%"></div></div></div>`; }); chartHTML += '</div>'; container.innerHTML = chartHTML; },
    openLeadModal(leadId = null) { const form = document.getElementById('form-lead'); form.reset(); document.getElementById('lead-id').value = ''; this.populateSelect('lead-origem', this.data.origens, false); this.populateSelect('lead-status', this.FUNIL_STATUS, false); this.populateSelect('lead-unidade', this.UNIDADES, false); this.populateSelect('lead-medico', this.data.medicos.map(m => m.nome), false, 'Nenhum'); if (leadId) { this.state.editingLeadId = leadId; const lead = this.data.leads.find(l => l.id === leadId); document.getElementById('modal-title').innerText = 'Editar Lead'; document.getElementById('lead-id').value = lead.id; document.getElementById('lead-nome').value = lead.nome; document.getElementById('lead-data').value = new Date(lead.dataCriacao).toISOString().split('T')[0]; document.getElementById('lead-telefone').value = lead.telefone; document.getElementById('lead-origem').value = lead.origem; document.getElementById('lead-status').value = lead.status; document.getElementById('lead-medico').value = lead.medico; document.getElementById('lead-unidade').value = lead.unidade; document.getElementById('lead-protocolo').value = lead.protocoloVendido || 'Não'; document.getElementById('lead-valor-protocolo').value = lead.valorProtocolo; } else { this.state.editingLeadId = null; document.getElementById('modal-title').innerText = 'Adicionar Novo Lead'; document.getElementById('lead-protocolo').value = 'Não'; document.getElementById('lead-data').value = new Date().toISOString().split('T')[0]; } document.getElementById('modal-novo-lead').classList.remove('hidden'); document.getElementById('modal-novo-lead').classList.add('flex'); },
    closeLeadModal() { document.getElementById('modal-novo-lead').classList.add('hidden'); document.getElementById('modal-novo-lead').classList.remove('flex'); },
    
    // ATUALIZADO: renderMetricas agora usa as novas regras do funil e origens
    renderMetricas() {
        this.populateFilters('dash');
        const filters = this.getFilters('dash');
        const filteredLeads = this.filterLeads(filters);
        const { totalLeads, protocolosVendidos, cpl, cpa, faturamento, consultasAgendadas, consultasRealizadas } = this.calculateKPIs(filteredLeads, filters);
        const kpisContainer = document.getElementById('dashboard-kpis');
        kpisContainer.className = "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4 md:gap-6 mb-6";
        kpisContainer.innerHTML = `
            <div class="bg-white p-6 rounded-lg shadow text-center"><h3 class="text-lg text-tm-texto-secundario font-semibold">Total Leads</h3><p class="text-4xl font-bold text-tm-verde">${totalLeads}</p></div>
            <div class="bg-white p-6 rounded-lg shadow text-center"><h3 class="text-lg text-tm-texto-secundario font-semibold">Consultas Agendadas</h3><p class="text-4xl font-bold text-tm-verde">${consultasAgendadas}</p></div>
            <div class="bg-white p-6 rounded-lg shadow text-center"><h3 class="text-lg text-tm-texto-secundario font-semibold">Consultas Realizadas</h3><p class="text-4xl font-bold text-tm-verde">${consultasRealizadas}</p></div>
            <div class="bg-white p-6 rounded-lg shadow text-center"><h3 class="text-lg text-tm-texto-secundario font-semibold">Protocolos Vendidos</h3><p class="text-4xl font-bold text-tm-verde">${protocolosVendidos}</p></div>
            <div class="bg-white p-6 rounded-lg shadow text-center"><h3 class="text-lg text-tm-texto-secundario font-semibold">CPL</h3><p class="text-4xl font-bold text-tm-verde">${this.formatCurrency(cpl)}</p></div>
            <div class="bg-white p-6 rounded-lg shadow text-center"><h3 class="text-lg text-tm-texto-secundario font-semibold">CPA</h3><p class="text-4xl font-bold text-tm-verde">${this.formatCurrency(cpa)}</p></div>
            <div class="bg-white p-6 rounded-lg shadow text-center"><h3 class="text-lg text-tm-texto-secundario font-semibold">Faturamento</h3><p class="text-4xl font-bold text-tm-verde">${this.formatCurrency(faturamento)}</p></div>`;
        
        const leadsParaFunil = filteredLeads.map(lead => {
            let status = lead.status;
            if (status === 'Qualificação') status = 'Primeiro Contato';
            if (status === 'Protocolo Venda') status = 'Consulta Realizada';
            return { ...lead, status: status };
        });
        const statusParaFunil = this.FUNIL_STATUS_DISPLAY; // Já inclui "Perdido" e exclui "Qualificação"
        
        this.renderChart('chart-funil', 'Funil de Vendas', statusParaFunil, leadsParaFunil, 'status', 'bg-tm-verde');
        this.renderChart('chart-origem', 'Leads por Origem', this.data.origens, filteredLeads, 'origem', 'bg-tm-dourado');
    },

    renderComparativo() { const hoje = new Date(); const anoAtual = hoje.getFullYear(); const mesAtual = String(hoje.getMonth() + 1).padStart(2, '0'); hoje.setMonth(hoje.getMonth() - 1); const anoAnterior = hoje.getFullYear(); const mesAnterior = String(hoje.getMonth() + 1).padStart(2, '0'); document.getElementById('comp-mes1').value = `${anoAnterior}-${mesAnterior}`; document.getElementById('comp-mes2').value = `${anoAtual}-${mesAtual}`; document.getElementById('comp-semanal-mes').value = `${anoAtual}-${mesAtual}`; const fimArco = new Date(); const inicioArco = new Date(); inicioArco.setMonth(fimArco.getMonth() - 3); inicioArco.setDate(1); document.getElementById('comp-arco-inicio').value = inicioArco.toISOString().split('T')[0]; document.getElementById('comp-arco-fim').value = fimArco.toISOString().split('T')[0]; this.renderCompMesAMes(); this.renderCompArco(); this.renderCompSemanal(); },
    
    // ATUALIZADO: usa this.data.origens
    renderCompMesAMes() {
        const mes1ISO = document.getElementById('comp-mes1').value;
        const mes2ISO = document.getElementById('comp-mes2').value;
        const container = document.getElementById('comparativo-mes-a-mes-content');
        if (!container || !mes1ISO || !mes2ISO) { return; }
        const calcularMetricasParaMes = (mesISO) => {
            const [ano, mes] = mesISO.split('-').map(Number);
            const leadsDoMes = this.data.leads.filter(lead => {
                if (!lead.dataCriacao) return false;
                const dataLead = new Date(lead.dataCriacao);
                return dataLead.getFullYear() === ano && dataLead.getMonth() + 1 === mes;
            });
            return this.getMetricsForLeads(leadsDoMes);
        };
        const metricaMes1 = calcularMetricasParaMes(mes1ISO);
        const metricaMes2 = calcularMetricasParaMes(mes2ISO);
        const calcularVariacao = (v2, v1) => { if (v1 === 0) return v2 > 0 ? '<span class="text-green-600 font-bold">Novo</span>' : '<span>-</span>'; const variacao = ((v2 - v1) / v1) * 100; const cor = variacao > 0 ? 'text-green-600' : 'text-red-600'; const sinal = variacao > 0 ? '+' : ''; return `<span class="${cor} font-bold">${sinal}${variacao.toFixed(1)}%</span>`; };
        const criarLinha = (metrica) => `<tr class="border-b"><td class="p-2">${metrica.nome}</td><td class="p-2 text-center">${metrica.format(metrica.m1)}</td><td class="p-2 text-center">${metrica.format(metrica.m2)}</td><td class="p-2 text-center">${calcularVariacao(metrica.m2, metrica.m1)}</td></tr>`;
        const criarHeader = (titulo) => `<tr class="bg-gray-50"><td class="p-2 font-bold text-tm-texto-principal" colspan="4">${titulo}</td></tr>`;
        let tableHTML = '<table class="w-full text-left text-sm"><thead><tr class="border-b-2 border-gray-300"><th class="p-2 font-semibold">Métrica</th><th class="p-2 font-semibold text-center">'+mes1ISO+'</th><th class="p-2 font-semibold text-center">'+mes2ISO+'</th><th class="p-2 font-semibold text-center">Variação</th></tr></thead><tbody>';
        tableHTML += criarHeader('KPIs Principais');
        tableHTML += criarLinha({ nome: 'Total de Leads', m1: metricaMes1.totalLeads, m2: metricaMes2.totalLeads, format: v => v });
        tableHTML += criarLinha({ nome: 'Consultas Realizadas', m1: metricaMes1.consultasRealizadas, m2: metricaMes2.consultasRealizadas, format: v => v });
        tableHTML += criarLinha({ nome: 'Protocolos Vendidos', m1: metricaMes1.protocolosVendidos, m2: metricaMes2.protocolosVendidos, format: v => v });
        tableHTML += criarLinha({ nome: 'Faturamento', m1: metricaMes1.faturamento, m2: metricaMes2.faturamento, format: v => this.formatCurrency(v) });
        tableHTML += criarHeader('Funil de Vendas');
        this.FUNIL_STATUS_DISPLAY.forEach(status => { tableHTML += criarLinha({ nome: status, m1: metricaMes1.funil[status], m2: metricaMes2.funil[status], format: v => v }); });
        tableHTML += criarHeader('Origem dos Leads');
        this.data.origens.forEach(origem => { tableHTML += criarLinha({ nome: origem, m1: metricaMes1.origens[origem] || 0, m2: metricaMes2.origens[origem] || 0, format: v => v }); });
        tableHTML += '</tbody></table>';
        container.innerHTML = tableHTML;
    },
    
    renderCompArco() { const container = document.getElementById('comparativo-arco-content'); const inicioStr = document.getElementById('comp-arco-inicio').value; const fimStr = document.getElementById('comp-arco-fim').value; if (!container || !inicioStr || !fimStr) return; const dataInicio = new Date(inicioStr + 'T00:00:00'); const dataFim = new Date(fimStr + 'T23:59:59'); const leadsNoArco = this.data.leads.filter(lead => { if (!lead.dataCriacao) return false; const dataLead = new Date(lead.dataCriacao); return dataLead >= dataInicio && dataLead <= dataFim; }); if (leadsNoArco.length === 0) { container.innerHTML = '<p class="text-tm-texto-secundario">Nenhum dado encontrado para este período.</p>'; return; } const totaisArco = this.getMetricsForLeads(leadsNoArco); let totaisHTML = ` <h4 class="font-semibold text-lg mb-2">Totais do Período</h4> <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6 text-center"> <div class="p-4 bg-gray-50 rounded-lg"><div class="text-sm text-tm-texto-secundario">Total Leads</div><div class="text-2xl font-bold text-tm-verde">${totaisArco.totalLeads}</div></div> <div class="p-4 bg-gray-50 rounded-lg"><div class="text-sm text-tm-texto-secundario">Consultas Realizadas</div><div class="text-2xl font-bold text-tm-verde">${totaisArco.consultasRealizadas}</div></div> <div class="p-4 bg-gray-50 rounded-lg"><div class="text-sm text-tm-texto-secundario">Faturamento</div><div class="text-2xl font-bold text-tm-verde">${this.formatCurrency(totaisArco.faturamento)}</div></div> <div class="p-4 bg-gray-50 rounded-lg"><div class="text-sm text-tm-texto-secundario">Google Ads</div><div class="text-2xl font-bold text-tm-verde">${totaisArco.origens['Google Ads'] || 0}</div></div> <div class="p-4 bg-gray-50 rounded-lg"><div class="text-sm text-tm-texto-secundario">Instagram</div><div class="text-2xl font-bold text-tm-verde">${totaisArco.origens['Instagram'] || 0}</div></div> </div> <hr class="my-6">`; const dadosMensais = {}; let dataCorrente = new Date(dataInicio); while (dataCorrente <= dataFim) { const mesISO = dataCorrente.getFullYear() + '-' + String(dataCorrente.getMonth() + 1).padStart(2, '0'); dadosMensais[mesISO] = { totalLeads: 0, faturamento: 0, googleLeads: 0, instagramLeads: 0 }; dataCorrente.setMonth(dataCorrente.getMonth() + 1); } const medicosMap = new Map(this.data.medicos.map(m => [m.nome, m.valorConsulta])); leadsNoArco.forEach(lead => { const dataLead = new Date(lead.dataCriacao); const mesISO = dataLead.getFullYear() + '-' + String(dataLead.getMonth() + 1).padStart(2, '0'); if (dadosMensais[mesISO]) { let faturamentoLead = 0; if (lead.protocoloVendido === 'Sim') { faturamentoLead += (lead.valorProtocolo || 0); } if (['Consulta Realizada', 'Protocolo Venda'].includes(lead.status) && lead.medico) { faturamentoLead += (medicosMap.get(lead.medico) || 0); } dadosMensais[mesISO].faturamento += faturamentoLead; dadosMensais[mesISO].totalLeads += 1; if (lead.origem === 'Google Ads') dadosMensais[mesISO].googleLeads += 1; if (lead.origem === 'Instagram') dadosMensais[mesISO].instagramLeads += 1; } }); const renderChartEvolucao = (titulo, data, chave, cor, formatFn) => { const valores = Object.values(data).map(item => item[chave]); const maxValor = Math.max(...valores, 1); let chartHTML = `<div class="mb-6"><h4 class="font-semibold text-lg mb-2">${titulo}</h4><div class="flex items-end h-40 space-x-2 border-l border-b border-gray-300 p-2">`; for (const mes in data) { const valor = data[mes][chave]; const altura = (valor / maxValor) * 100; chartHTML += ` <div class="flex-1 flex flex-col items-center justify-end" title="${mes}: ${formatFn(valor)}"> <div class="text-xs font-bold -mb-1">${formatFn(valor)}</div> <div class="${cor} w-full rounded-t-sm" style="height: ${altura}%"></div> <div class="text-xs text-tm-texto-secundario mt-1">${mes.substring(5)}/${mes.substring(2,4)}</div> </div>`; } chartHTML += '</div></div>'; return chartHTML; }; const renderLeadsGroupedChart = () => { let chartHTML = `<div class="mb-6"><h4 class="font-semibold text-lg mb-2">Evolução de Leads (Total vs. Origens Principais)</h4>`; chartHTML += `<div class="flex items-center space-x-4 mb-2 text-sm"> <div class="flex items-center"><span class="w-3 h-3 rounded-full bg-tm-verde mr-2"></span>Total</div> <div class="flex items-center"><span class="w-3 h-3 rounded-full bg-blue-500 mr-2"></span>Google Ads</div> <div class="flex items-center"><span class="w-3 h-3 rounded-full bg-pink-500 mr-2"></span>Instagram</div> </div>`; chartHTML += `<div class="flex items-stretch h-64 space-x-2 border-l border-b border-gray-300 p-2">`; const allValues = Object.values(dadosMensais).flatMap(d => [d.totalLeads, d.googleLeads, d.instagramLeads]); const maxValor = Math.max(...allValues, 1); for (const mes in dadosMensais) { const data = dadosMensais[mes]; const hTotal = (data.totalLeads / maxValor) * 100; const hGoogle = (data.googleLeads / maxValor) * 100; const hInstagram = (data.instagramLeads / maxValor) * 100; chartHTML += `<div class="flex-1 flex flex-col items-center"> <div class="w-full flex-grow flex items-end justify-center space-x-1"> <div title="Total: ${data.totalLeads}" class="bg-tm-verde w-1/3" style="height: ${hTotal}%;"></div> <div title="Google Ads: ${data.googleLeads}" class="bg-blue-500 w-1/3" style="height: ${hGoogle}%;"></div> <div title="Instagram: ${data.instagramLeads}" class="bg-pink-500 w-1/3" style="height: ${hInstagram}%;"></div> </div> <div class="text-xs text-tm-texto-secundario mt-1">${mes.substring(5)}/${mes.substring(2,4)}</div> </div>`; } chartHTML += '</div></div>'; return chartHTML; }; let graficosHTML = renderChartEvolucao('Evolução do Faturamento', dadosMensais, 'faturamento', 'bg-tm-verde', v => this.formatCurrency(v)); graficosHTML += renderLeadsGroupedChart(); container.innerHTML = totaisHTML + graficosHTML; },
    
    // ATUALIZADO: usa this.data.origens
    renderCompSemanal() {
        const mesISO = document.getElementById('comp-semanal-mes').value;
        const container = document.getElementById('comparativo-semanal-content');
        if (!container || !mesISO) return;
        const [ano, mes] = mesISO.split('-').map(Number);
        const getLeadsNaSemana = (semana) => {
            const dias = { 1: [1, 7], 2: [8, 14], 3: [15, 21], 4: [22, 31] };
            return this.data.leads.filter(lead => {
                const dataLead = new Date(lead.dataCriacao);
                const dia = dataLead.getDate();
                return dataLead.getFullYear() === ano && dataLead.getMonth() + 1 === mes && (dia >= dias[semana][0] && dia <= dias[semana][1]);
            });
        };
        const semanas = [1, 2, 3, 4].map(s => this.getMetricsForLeads(getLeadsNaSemana(s)));
        let tableHTML = '<table class="w-full text-left text-sm"><thead><tr class="border-b-2 border-gray-300"><th class="p-2 font-semibold">Métrica</th><th class="p-2 font-semibold text-center">Semana 1</th><th class="p-2 font-semibold text-center">Semana 2</th><th class="p-2 font-semibold text-center">Semana 3</th><th class="p-2 font-semibold text-center">Semana 4</th><th class="p-2 font-bold text-center bg-gray-200">Total Mês</th></tr></thead><tbody>';
        const addRow = (label, isHeader = false) => {
            if(isHeader) { tableHTML += `<tr class="bg-gray-50"><td class="p-2 font-bold text-tm-texto-principal" colspan="6">${label}</td></tr>`; return; }
            const total = semanas.reduce((acc, semana) => acc + label.getValue(semana), 0);
            tableHTML += `<tr><td class="p-2 border-b">${label.nome}</td>${semanas.map(s => `<td class="p-2 border-b text-center">${label.format(label.getValue(s))}</td>`).join('')}<td class="p-2 border-b text-center font-bold bg-gray-100">${label.format(total)}</td></tr>`;
        };
        addRow('KPIs Principais', true);
        addRow({ nome: 'Total Leads', getValue: s => s.totalLeads, format: v => v});
        addRow({ nome: 'Faturamento', getValue: s => s.faturamento, format: v => this.formatCurrency(v)});
        addRow('Funil de Vendas', true);
        this.FUNIL_STATUS_DISPLAY.forEach(status => { addRow({ nome: status, getValue: s => s.funil[status], format: v => v}); });
        addRow('Origem dos Leads', true);
        this.data.origens.forEach(origem => { addRow({ nome: origem, getValue: s => s.origens[origem] || 0, format: v => v}); });
        tableHTML += '</tbody></table>';
        container.innerHTML = tableHTML;
    },
    
    renderGerenciarLeads() {
        this.populateFilters('leads');
        const filters = this.getFilters('leads');
        const filteredLeads = this.filterLeads(filters);
        const startIndex = (this.state.leadsPage - 1) * this.state.leadsRowsPerPage;
        const endIndex = startIndex + this.state.leadsRowsPerPage;
        const paginatedLeads = filteredLeads.slice(startIndex, endIndex);
        const head = document.getElementById('tabela-leads-head');
        head.innerHTML = `<tr class="border-b bg-gray-50 text-tm-texto-secundario"><th class="p-3 text-left font-semibold hidden lg:table-cell">Data</th><th class="p-3 text-left font-semibold">Nome</th><th class="p-3 text-left font-semibold hidden sm:table-cell">Telefone</th><th class="p-3 text-left font-semibold">Status</th><th class="p-3 text-left font-semibold hidden md:table-cell">Médico</th><th class="p-3 text-left font-semibold hidden lg:table-cell">Protocolo</th><th class="p-3 text-left font-semibold hidden lg:table-cell">Unidade</th><th class="p-3 text-left font-semibold hidden lg:table-cell">Origem</th><th class="p-3 text-left font-semibold">Ações</th></tr>`;
        const body = document.getElementById('tabela-leads-body');
        body.innerHTML = '';
        paginatedLeads.forEach(lead => {
            const tr = document.createElement('tr');
            tr.className = 'border-b hover:bg-gray-50';
            tr.innerHTML = `
                <td class="p-3 text-sm hidden lg:table-cell">${lead.dataCriacao ? new Date(lead.dataCriacao).toLocaleDateString() : 'N/A'}</td>
                <td class="p-3 font-semibold">${lead.nome}</td>
                <td class="p-3 hidden sm:table-cell">${lead.telefone || ''}</td>
                <td class="p-3">
                    <select data-quick-edit="true" data-field="status" data-id="${lead.id}" class="p-1 border rounded-md w-full bg-white text-sm">
                        ${this.FUNIL_STATUS.map(s => `<option value="${s}" ${s === lead.status ? 'selected' : ''}>${s}</option>`).join('')}
                    </select>
                </td>
                <td class="p-3 hidden md:table-cell">
                    <select data-quick-edit="true" data-field="medico" data-id="${lead.id}" class="p-1 border rounded-md w-full bg-white text-sm">
                        <option value="">Nenhum</option>
                        ${this.data.medicos.map(m => `<option value="${m.nome}" ${m.nome === lead.medico ? 'selected' : ''}>${m.nome}</option>`).join('')}
                    </select>
                </td>
                <td class="p-3 hidden lg:table-cell">
                    <select data-quick-edit="true" data-field="protocoloVendido" data-id="${lead.id}" class="p-1 border rounded-md w-full bg-white text-sm">
                        <option value="Não" ${lead.protocoloVendido === 'Não' ? 'selected' : ''}>Não</option>
                        <option value="Sim" ${lead.protocoloVendido === 'Sim' ? 'selected' : ''}>Sim</option>
                    </select>
                </td>
                <td class="p-3 hidden lg:table-cell">
                    <select data-quick-edit="true" data-field="unidade" data-id="${lead.id}" class="p-1 border rounded-md w-full bg-white text-sm">
                        ${this.UNIDADES.map(u => `<option value="${u}" ${u === lead.unidade ? 'selected' : ''}>${u}</option>`).join('')}
                    </select>
                </td>
                <td class="p-3 hidden lg:table-cell">
                    <select data-quick-edit="true" data-field="origem" data-id="${lead.id}" class="p-1 border rounded-md w-full bg-white text-sm">
                        ${this.data.origens.map(o => `<option value="${o}" ${o === lead.origem ? 'selected' : ''}>${o}</option>`).join('')}
                    </select>
                </td>
                <td class="p-3 text-center">
                    <button data-action="open-lead-modal" data-id="${lead.id}" class="text-tm-azul hover:text-tm-azul-hover"><i class="fas fa-edit"></i></button>
                    <button data-action="delete-lead" data-id="${lead.id}" class="text-tm-bordo hover:opacity-80 ml-3"><i class="fas fa-trash"></i></button>
                </td>`;
            body.appendChild(tr);
        });
        this.renderPagination(filteredLeads.length);
    },

    renderPagination(totalItems) { const container = document.getElementById('leads-pagination'); const totalPages = Math.ceil(totalItems / this.state.leadsRowsPerPage); const currentPage = this.state.leadsPage; if (totalPages <= 1) { container.innerHTML = ''; return; } let paginationHTML = `<button data-action="change-page" data-page="${currentPage - 1}" class="px-3 py-1 border rounded-md ${currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'hover:bg-gray-200'}" ${currentPage === 1 ? 'disabled' : ''}>Anterior</button>`; for (let i = 1; i <= totalPages; i++) { if (i === currentPage) { paginationHTML += `<button data-action="change-page" data-page="${i}" class="px-3 py-1 border rounded-md bg-tm-verde text-white">${i}</button>`; } else if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) { paginationHTML += `<button data-action="change-page" data-page="${i}" class="px-3 py-1 border rounded-md hover:bg-gray-200">${i}</button>`; } else if (i === currentPage - 2 || i === currentPage + 2) { paginationHTML += `<span class="px-3 py-1">...</span>`; } } paginationHTML += `<button data-action="change-page" data-page="${currentPage + 1}" class="px-3 py-1 border rounded-md ${currentPage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'hover:bg-gray-200'}" ${currentPage === totalPages ? 'disabled' : ''}>Próximo</button>`; container.innerHTML = paginationHTML; },
    renderAnaliseMedicos() { this.populateFilters('medicos'); const filters = this.getFilters('medicos'); const filteredLeads = this.filterLeads(filters); const totalConsultasGeral = filteredLeads.filter(l => l.status === 'Consulta Realizada' || l.status === 'Protocolo Venda').length; const container = document.getElementById('medicos-performance-table'); let tableHTML = `<table class="w-full text-left font-medium"><thead class="border-b bg-gray-50 text-tm-texto-secundario"><tr><th class="p-3 font-semibold">Médico</th><th class="p-3 font-semibold">Consultas Realizadas</th><th class="p-3 font-semibold">% do Total de Consultas</th><th class="p-3 font-semibold">Protocolos Vendidos</th><th class="p-3 font-semibold">% Conversão (Consulta &gt; Venda)</th><th class="p-3 font-semibold">Faturamento Gerado</th></tr></thead><tbody>`; this.data.medicos.forEach(medico => { const medicoLeads = filteredLeads.filter(l => l.medico === medico.nome); const consultasRealizadas = medicoLeads.filter(l => l.status === 'Consulta Realizada' || l.status === 'Protocolo Venda').length; const protocolosVendidos = medicoLeads.filter(l => l.protocoloVendido === 'Sim').length; const percTotalConsultas = totalConsultasGeral > 0 ? (consultasRealizadas / totalConsultasGeral) * 100 : 0; const conversao = consultasRealizadas > 0 ? (protocolosVendidos / consultasRealizadas) * 100 : 0; const faturamentoConsultas = consultasRealizadas * medico.valorConsulta; const faturamentoProtocolos = medicoLeads.filter(l => l.protocoloVendido === 'Sim').reduce((sum, l) => sum + (l.valorProtocolo || 0), 0); const faturamentoTotal = faturamentoConsultas + faturamentoProtocolos; tableHTML += `<tr class="border-b hover:bg-gray-50"><td class="p-3 font-semibold text-tm-texto-principal">${medico.nome}</td><td class="p-3">${consultasRealizadas}</td><td class="p-3">${percTotalConsultas.toFixed(1)}%</td><td class="p-3">${protocolosVendidos}</td><td class="p-3">${conversao.toFixed(1)}%</td><td class="p-3">${this.formatCurrency(faturamentoTotal)}</td></tr>`; }); tableHTML += '</tbody></table>'; container.innerHTML = tableHTML; },
    renderConfiguracoes() { const listaMedicos = document.getElementById('lista-medicos'); listaMedicos.innerHTML = this.data.medicos.map(medico => `<div class="flex justify-between items-center p-2 border-b"><span><span class="font-semibold text-tm-texto-principal">${medico.nome}</span> - ${this.formatCurrency(medico.valorConsulta)}</span><button data-action="delete-medico" data-id="${medico.id}" class="text-tm-bordo hover:opacity-80"><i class="fas fa-trash"></i></button></div>`).join(''); const listaCustos = document.getElementById('lista-custos'); listaCustos.innerHTML = this.data.custos.map(custo => `<div class="flex justify-between items-center p-2 border-b"><span><span class="font-semibold text-tm-texto-principal">${custo.mes}</span>: G: ${this.formatCurrency(custo.google)} | M: ${this.formatCurrency(custo.meta)} | O: ${this.formatCurrency(custo.outros)}</span><button data-action="delete-custo" data-mes="${custo.mes}" class="text-tm-bordo hover:opacity-80"><i class="fas fa-trash"></i></button></div>`).join(''); },
    renderReport() { const filters = this.getFilters('leads'); const filteredLeads = this.filterLeads(filters); const container = document.getElementById('relatorio-conteudo'); let reportHTML = `<table class="report-table"><thead><tr><th>Data</th><th>Nome</th><th>Telefone</th><th>Status</th><th>Origem</th><th>Unidade</th><th>Médico</th></tr></thead><tbody>`; filteredLeads.forEach(lead => { reportHTML += `<tr><td>${new Date(lead.dataCriacao).toLocaleDateString()}</td><td>${lead.nome || ''}</td><td>${lead.telefone || ''}</td><td>${lead.status || ''}</td><td>${lead.origem || ''}</td><td>${lead.unidade || ''}</td><td>${lead.medico || 'N/A'}</td></tr>`; }); reportHTML += '</tbody></table>'; container.innerHTML = reportHTML; document.getElementById('view-relatorio').classList.remove('hidden'); },
};

document.addEventListener('DOMContentLoaded', () => app.init());
