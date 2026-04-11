import MockAdapter from 'axios-mock-adapter'
import { api } from './api'

export const setupMocks = () => {
  const mock = new MockAdapter(api, { delayResponse: 500 })

  console.log('🛠️ Mock Mode Ativado: Usando dados estáticos de Papelaria.')

  // 1. Mock do Dashboard
  mock.onGet('/dashboard/stats').reply(200, {
    totalValue: 12540.50,
    totalItems: 842,
    lowStockItems: 3,
    recentMovements: [
      {
        id: '1',
        type: 'IN',
        quantity: 100,
        createdAt: new Date().toISOString(),
        product: { name: 'Caneta Esferográfica Azul' }
      },
      {
        id: '2',
        type: 'OUT',
        quantity: 5,
        createdAt: new Date().toISOString(),
        product: { name: 'Caderno 10 Matérias' }
      },
      {
        id: '3',
        type: 'IN',
        quantity: 20,
        createdAt: new Date().toISOString(),
        product: { name: 'Papel A4 500fls' }
      }
    ]
  })

  // 2. Mock de Produtos
  mock.onGet('/products').reply(200, [
    {
      id: 'p1',
      name: 'Caderno 10 Matérias',
      sku: 'CAD-001',
      unitOfMeasure: 'UN',
      minStock: 10,
      currentStock: 45,
      averageCost: 15.50,
      sellingPrice: 29.90,
      category: { name: 'Escolar' }
    },
    {
      id: 'p2',
      name: 'Caneta Esferográfica Azul',
      sku: 'CAN-001',
      unitOfMeasure: 'UN',
      minStock: 50,
      currentStock: 8, // ESTOQUE BAIXO
      averageCost: 0.85,
      sellingPrice: 2.50,
      category: { name: 'Escrita' }
    },
    {
      id: 'p3',
      name: 'Papel A4 500fls',
      sku: 'PAP-A4',
      unitOfMeasure: 'CX',
      minStock: 5,
      currentStock: 12,
      averageCost: 22.00,
      sellingPrice: 38.00,
      category: { name: 'Papéis' }
    },
    {
      id: 'p4',
      name: 'Lápis de Cor 24 Cores',
      sku: 'LAP-024',
      unitOfMeasure: 'CX',
      minStock: 15,
      currentStock: 3, // ESTOQUE BAIXO
      averageCost: 12.30,
      sellingPrice: 24.90,
      category: { name: 'Escolar' }
    }
  ])

  // 3. Mock de Movimentações
  mock.onGet('/movements').reply(200, [
    {
      id: 'm1',
      type: 'IN',
      quantity: 50,
      unitValue: 15.50,
      totalValue: 775.00,
      createdAt: new Date().toISOString(),
      product: { name: 'Caderno 10 Matérias', sku: 'CAD-001' },
      user: { name: 'Administrador' },
      invoiceNumber: 'NFe-1029'
    },
    {
      id: 'm2',
      type: 'OUT',
      quantity: 2,
      unitValue: 2.50,
      totalValue: 5.00,
      createdAt: new Date().toISOString(),
      product: { name: 'Caneta Esferográfica Azul', sku: 'CAN-001' },
      user: { name: 'Vendedor Loja' },
      invoiceNumber: 'Venda-882'
    }
  ])

  // 4. Mock de Categorias
  mock.onGet('/categories').reply(200, [
    { id: 'c1', name: 'Escolar' },
    { id: 'c2', name: 'Escrita' },
    { id: 'c3', name: 'Papéis' }
  ])

  // 5. Fallback para POSTs (simular sucesso)
  mock.onPost('/products').reply(201)
  mock.onPost('/movements').reply(201)
}
