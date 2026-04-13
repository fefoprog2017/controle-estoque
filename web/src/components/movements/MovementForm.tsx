import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { api } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useEffect, useState } from 'react'

const movementSchema = z.object({
  productId: z.string().min(1, 'Produto é obrigatório'),
  type: z.enum(['IN', 'OUT']),
  quantity: z.coerce.number().min(0.01, 'Quantidade deve ser maior que zero'),
  unitValue: z.coerce.number().min(0.01, 'Valor deve ser maior que zero'),
  invoiceNumber: z.string().optional(),
  notes: z.string().min(5, 'A observação deve ter pelo menos 5 caracteres'),
})

type MovementFormValues = z.infer<typeof movementSchema>

interface Product {
  id: string
  name: string
  sku: string
}

interface MovementFormProps {
  onSuccess: () => void
}

export function MovementForm({ onSuccess }: MovementFormProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [file, setFile] = useState<File | null>(null)

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<MovementFormValues>({
    resolver: zodResolver(movementSchema) as any,
    defaultValues: {
      type: 'IN',
      quantity: 1,
    }
  })

  const type = watch('type')

  useEffect(() => {
    api.get('/products').then(res => setProducts(res.data))
  }, [])

  async function onSubmit(data: MovementFormValues) {
    try {
      const formData = new FormData()
      
      // Adicionar campos ao FormData
      Object.entries(data).forEach(([key, value]) => {
        formData.append(key, String(value))
      })

      // Adicionar o Usuário Fixo (No mundo real, viria do Auth)
      formData.append('userId', "00000000-0000-0000-0000-000000000000")

      // Adicionar Arquivo se existir
      if (file) {
        formData.append('file', file)
      }

      await api.post('/movements', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      onSuccess()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erro ao registrar movimentação')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
      <div className="space-y-2">
        <Label>Tipo de Operação</Label>
        <div className="flex gap-4">
          <label className={`flex-1 border p-3 rounded-md cursor-pointer flex items-center gap-2 ${type === 'IN' ? 'border-emerald-500 bg-emerald-50' : ''}`}>
            <input type="radio" value="IN" {...register('type')} className="accent-emerald-600" />
            <span className="text-sm font-medium">Entrada (Devolução)</span>
          </label>
          <label className={`flex-1 border p-3 rounded-md cursor-pointer flex items-center gap-2 ${type === 'OUT' ? 'border-rose-500 bg-rose-50' : ''}`}>
            <input type="radio" value="OUT" {...register('type')} className="accent-rose-600" />
            <span className="text-sm font-medium">Saída (Venda/Devolução)</span>
          </label>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="productId">Produto</Label>
        <select 
          id="productId" 
          {...register('productId')}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">Selecione um produto...</option>
          {products.map(p => (
            <option key={p.id} value={p.id}>{p.sku} - {p.name}</option>
          ))}
        </select>
        {errors.productId && <p className="text-xs text-red-500">{errors.productId.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="quantity">Quantidade</Label>
          <Input id="quantity" type="number" step="0.01" {...register('quantity')} />
          {errors.quantity && <p className="text-xs text-red-500">{errors.quantity.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="unitValue">Valor Unitário (R$)</Label>
          <Input id="unitValue" type="number" step="0.01" {...register('unitValue')} />
          {errors.unitValue && <p className="text-xs text-red-500">{errors.unitValue.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="invoiceNumber">Número da NFe (Opcional)</Label>
          <Input id="invoiceNumber" {...register('invoiceNumber')} placeholder="000.000.000" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="file">Anexo da Nota (PDF/IMG)</Label>
          <Input 
            id="file" 
            type="file" 
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="cursor-pointer"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Observações / Motivo (Obrigatório)</Label>
        <Input id="notes" {...register('notes')} placeholder="Ex: Venda para cliente ou devolução..." />
        {errors.notes && <p className="text-xs text-red-500">{errors.notes.message}</p>}
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Processando...' : 'Confirmar Movimentação'}
      </Button>
    </form>
  )
}
