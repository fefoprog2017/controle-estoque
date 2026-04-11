const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- BUSCANDO PRODUTOS DE PAPELARIA ---');
  
  const products = await prisma.product.findMany({
    where: {
      OR: [
        { category: { name: { contains: 'Papelaria' } } },
        { name: { contains: 'Papel' } },
        { name: { contains: 'Caneta' } },
        { name: { contains: 'Lápis' } },
        { sku: { contains: 'PAP' } }
      ]
    },
    include: {
      category: true
    }
  });

  console.log(`Encontrados ${products.length} produtos.`);
  
  for (const p of products) {
    console.log(`Removendo: [${p.sku}] ${p.name} (ID: ${p.id})`);
    
    // Remover movimentações primeiro para evitar erro de FK
    await prisma.movement.deleteMany({
      where: { productId: p.id }
    });
    
    await prisma.product.delete({
      where: { id: p.id }
    });
  }

  console.log('--- LIMPEZA CONCLUÍDA ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
