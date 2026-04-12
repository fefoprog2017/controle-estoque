import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { api } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const productSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  sku: z.string().min(1, 'SKU é obrigatório'),
  barcode: z.string().optional(),
  unitOfMeasure: z.string().min(1, 'Unidade é obrigatória'),
  minStock: z.coerce.number().min(0),
  sellingPrice: z.coerce.number().min(0),
  averageCost: z.coerce.number().min(0), // Novo campo no schema
  description: z.string().optional(),
  aisle: z.string().optional(),
  shelf: z.string().optional(),
  batch: z.string().optional(),
})

type ProductFormValues = z.infer<typeof productSchema>

interface ProductFormProps {
  onSuccess: () => void
  product?: {
    id: string
    name: string
    sku: string
    barcode?: string | null
    unitOfMeasure: string
    minStock: number
    sellingPrice: number
    averageCost: number // Novo campo nas props
    description?: string | null
    aisle?: string | null
    shelf?: string | null
    batch?: string | null
  }
}

export function ProductForm({ onSuccess, product }: ProductFormProps) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: {
      name: product?.name || '',
      sku: product?.sku || '',
      barcode: product?.barcode || '',
      unitOfMeasure: product?.unitOfMeasure || 'UN',
      minStock: product?.minStock || 0,
      sellingPrice: product?.sellingPrice || 0,
      averageCost: product?.averageCost || 0, // Novo valor default
      description: product?.description || '',
      aisle: product?.aisle || '',
      shelf: product?.shelf || '',
      batch: product?.batch || '',
    }
  })

  async function onSubmit(data: ProductFormValues) {
    try {
      if (product) {
        await api.put(`/products/${product.id}`, data)
      } else {
        // Lógica de criação original
        let categoryId;
        try {
          const categories = await api.get('/categories')
          if (categories.data.length > 0) {
            categoryId = categories.data[0].id
          }
        } catch (e) {}

        const payload = {
          ...data,
          categoryId: categoryId || "00000000-0000-0000-0000-000000000000" 
        }
        await api.post('/products', payload)
      }
      onSuccess()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erro ao salvar produto')
    }
  }

  async function handleDelete() {
    if (!product) return
    
    if (!confirm('Tem certeza que deseja excluir este produto?')) return

    try {
      await api.delete(`/products/${product.id}`)
      onSuccess()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erro ao excluir produto. Verifique se ele possui movimentações.')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
      {/* ... (campos de formulário permanecem os mesmos) ... */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome do Produto</Label>
          <Input id="name" {...register('name')} placeholder="Ex: Cimento CP-II" />
          {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="sku">SKU / Código Interno</Label>
          <Input id="sku" {...register('sku')} placeholder="Ex: CIM-001" />
          {errors.sku && <p className="text-xs text-red-500">{errors.sku.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="unitOfMeasure">Unidade de Medida</Label>
          <Input id="unitOfMeasure" {...register('unitOfMeasure')} placeholder="UN, KG, M2..." />
        </div>
        <div className="space-y-2">
          <Label htmlFor="barcode">Código de Barras (EAN)</Label>
          <Input id="barcode" {...register('barcode')} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="sellingPrice">Preço de Venda (R$)</Label>
          <Input id="sellingPrice" type="number" step="0.01" {...register('sellingPrice')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="averageCost">Custo Médio (R$)</Label>
          <Input id="averageCost" type="number" step="0.01" {...register('averageCost')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="minStock">Estoque Mínimo (Alerta)</Label>
          <Input id="minStock" type="number" {...register('minStock')} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="aisle">Corredor</Label>
          <Input id="aisle" {...register('aisle')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="shelf">Prateleira</Label>
          <Input id="shelf" {...register('shelf')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="batch">Lote</Label>
          <Input id="batch" {...register('batch')} />
        </div>
      </div>

      <div className="flex gap-4 pt-4">
        {product && (
          <Button type="button" variant="destructive" className="flex-1" onClick={handleDelete}>
            Remover Produto
          </Button>
        )}
        <Button type="submit" className="flex-1" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando...' : product ? 'Salvar Alterações' : 'Cadastrar Produto'}
        </Button>
      </div>
    </form>
  )
}
