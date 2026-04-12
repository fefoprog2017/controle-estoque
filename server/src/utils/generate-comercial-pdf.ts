import puppeteer from 'puppeteer'

async function generateComercialPDF() {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })
  const page = await browser.newPage()

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Segoe+UI:wght@400;600;700&display=swap');
            
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                line-height: 1.6; 
                color: #1e293b;
                background: #fff;
            }
            .container { padding: 40px 60px; }
            
            header { 
                border-bottom: 3px solid #4f46e5; 
                padding-bottom: 20px; 
                margin-bottom: 40px; 
            }
            h1 { color: #1e1b4b; font-size: 32px; margin-bottom: 8px; }
            .subtitle { color: #64748b; font-size: 18px; }
            
            section { margin-bottom: 35px; }
            h2 { 
                color: #1e1b4b; 
                font-size: 22px; 
                margin-bottom: 15px; 
                display: flex; 
                align-items: center;
                border-left: 5px solid #4f46e5;
                padding-left: 15px;
            }
            
            p { margin-bottom: 12px; font-size: 15px; }
            
            .feature-list { list-style: none; margin-left: 5px; }
            .feature-item { 
                background: #f8fafc; 
                padding: 12px 18px; 
                border-radius: 8px; 
                margin-bottom: 10px; 
                border: 1px solid #e2e8f0;
            }
            .feature-item strong { color: #4f46e5; display: block; margin-bottom: 4px; }
            
            .tech-grid { 
                display: grid; 
                grid-template-columns: 1fr 1fr; 
                gap: 15px; 
                background: #f1f5f9; 
                padding: 20px; 
                border-radius: 12px;
            }
            .tech-box b { color: #1e1b4b; display: block; font-size: 12px; text-transform: uppercase; color: #64748b; }
            .tech-box span { font-weight: 600; }

            .functionality-grid { 
                display: grid; 
                grid-template-columns: 1fr 1fr; 
                gap: 20px; 
            }
            .func-card { 
                padding: 15px; 
                border-bottom: 2px solid #e2e8f0; 
            }
            .func-card h3 { color: #1e1b4b; font-size: 16px; margin-bottom: 5px; }
            .func-card p { font-size: 13px; color: #64748b; }

            .strategic-section { 
                background: #1e1b4b; 
                color: #fff; 
                padding: 30px; 
                border-radius: 16px; 
                margin-top: 40px;
            }
            .strategic-section h2 { border-left-color: #818cf8; color: #fff; padding-left: 0; border-left: 0; margin-bottom: 25px; }
            .differential { margin-bottom: 20px; border-bottom: 1px solid #312e81; padding-bottom: 15px; }
            .differential:last-child { border: 0; }
            .diff-title { color: #818cf8; font-weight: bold; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px; }
            .diff-text { font-style: italic; font-size: 14px; color: #e2e8f0; }

            footer { 
                margin-top: 50px; 
                text-align: center; 
                font-size: 12px; 
                color: #94a3b8; 
                border-top: 1px solid #f1f5f9; 
                padding-top: 20px; 
            }
            
            @media print {
                .container { padding: 20px 40px; }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <header>
                <h1>Documentação Técnica e Comercial</h1>
                <div class="subtitle">Sistema de Gestão de Estoque com Inteligência Artificial</div>
            </header>

            <section>
                <h2>01. Proposta de Valor</h2>
                <p>O sistema foi projetado para modernizar operações logísticas através de tecnologia de ponta, resolvendo três pilares fundamentais:</p>
                <div class="feature-list">
                    <div class="feature-item">
                        <strong>Automação Inteligente (IA)</strong>
                        Eliminação total da digitação manual de notas fiscais e pedidos através de OCR cognitivo (Gemini AI).
                    </div>
                    <div class="feature-item">
                        <strong>Saúde Financeira</strong>
                        Cálculo automático de Custo Médio Ponderado e rastreabilidade total de movimentações.
                    </div>
                    <div class="feature-item">
                        <strong>Infraestrutura de Elite</strong>
                        Arquitetura em nuvem escalável via Docker, garantindo alta disponibilidade e segurança.
                    </div>
                </div>
            </section>

            <section>
                <h2>02. Especificações (The Stack)</h2>
                <div class="tech-grid">
                    <div class="tech-box"><b>Frontend</b><span>React 19 & TypeScript</span></div>
                    <div class="tech-box"><b>Backend</b><span>Node.js & Fastify</span></div>
                    <div class="tech-box"><b>Database</b><span>SQLite com Prisma ORM</span></div>
                    <div class="tech-box"><b>Inteligência Artificial</b><span>Google Gemini 1.5 Flash</span></div>
                    <div class="tech-box"><b>Relatórios</b><span>Puppeteer PDF Engine</span></div>
                    <div class="tech-box"><b>Deployment</b><span>Docker & Nginx Proxy</span></div>
                </div>
            </section>

            <section>
                <h2>03. Funcionalidades Core</h2>
                <div class="functionality-grid">
                    <div class="func-card">
                        <h3>Dashboard Executivo</h3>
                        <p>Indicadores em tempo real do valor total investido e giro de estoque.</p>
                    </div>
                    <div class="func-card">
                        <h3>Módulo Subir Base</h3>
                        <p>Extração automática de produtos via PDF/Imagem com mapeamento de SKUs.</p>
                    </div>
                    <div class="func-card">
                        <h3>Log de Auditoria</h3>
                        <p>Histórico imutável de entradas e saídas para prevenção de perdas.</p>
                    </div>
                    <div class="func-card">
                        <h3>Relatórios Oficiais</h3>
                        <p>Emissão de documentos em PDF para conferência física e contábil.</p>
                    </div>
                </div>
            </section>

            <div class="strategic-section">
                <h2>Diferenciais Estratégicos (ROI)</h2>
                <div class="differential">
                    <div class="diff-title">Retorno sobre Investimento</div>
                    <div class="diff-text">"A redução do tempo de digitação de 4 horas para 5 minutos permite que sua equipe foque em vendas, pagando o sistema já no primeiro mês."</div>
                </div>
                <div class="differential">
                    <div class="diff-title">Blindagem de Margem</div>
                    <div class="diff-text">"O cálculo dinâmico de custo evita prejuízos invisíveis causados por flutuações de preços de fornecedores."</div>
                </div>
                <div class="differential">
                    <div class="diff-title">Tecnologia Corporativa</div>
                    <div class="diff-text">"O software utiliza a mesma base tecnológica de gigantes globais, garantindo longevidade e segurança ao seu negócio."</div>
                </div>
            </div>

            <footer>
                Documento Técnico-Comercial Confidencial • 2026 • Sistema de Gestão Inteligente
            </footer>
        </div>
    </body>
    </html>
  `

  await page.setContent(htmlContent, { waitUntil: 'networkidle0' })
  await page.pdf({
    path: 'DOCUMENTACAO_COMERCIAL.pdf',
    format: 'A4',
    printBackground: true,
    margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
  })

  await browser.close()
  console.log('PDF Refinado com sucesso!')
}

generateComercialPDF()
