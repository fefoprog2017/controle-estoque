import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasourceUrl: 'file:./dev.db'
})

async function main() {
  // Limpeza
  try {
    await prisma.movement.deleteMany()
    await prisma.product.deleteMany()
    await prisma.category.deleteMany()
    await prisma.user.deleteMany()
  } catch(e) {}

  // Usuário
  const user = await prisma.user.create({
    data: {
      id: "00000000-0000-0000-0000-000000000000",
      name: 'Gerente',
      email: 'gerente@papelaria.com',
      password: 'admin',
      role: 'ADMIN'
    }
  })

  // Categorias
  const catEscolar = await prisma.category.create({ data: { name: 'Escolar' } })
  const catEscritorio = await prisma.category.create({ data: { name: 'Escritório' } })

  // Produtos
  const p1 = await prisma.product.create({
    data: {
      name: 'Caderno 10 Matérias',
      sku: 'CAD-001',
      unitOfMeasure: 'UN',
      minStock: 10,
      currentStock: 50,
      averageCost: 15.50,
      sellingPrice: 29.90,
      categoryId: catEscolar.id
    }
  })

  const p2 = await prisma.product.create({
    data: {
      name: 'Caneta Azul',
      sku: 'CAN-001',
      unitOfMeasure: 'UN',
      minStock: 100,
      currentStock: 5,
      averageCost: 0.80,
      sellingPrice: 2.50,
      categoryId: catEscolar.id
    }
  })

  // Movimentações
  await prisma.movement.create({
    data: {
      type: 'IN',
      quantity: 50,
      unitValue: 15.50,
      totalValue: 775.00,
      productId: p1.id,
      userId: user.id,
      notes: 'Carga inicial'
    }
  })

  console.log('✅ Seed finalizado!')
}

main().then(() => prisma.$disconnect()).catch(e => { console.error(e); prisma.$disconnect(); process.exit(1); })
