import {
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { AlertTriangle, Save, Loader2, Plus, Trash2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { api } from '@/services/api'

interface ProductVariation {
  id: string
  name: string
  sku: string
  color?: string | null
  size?: string | null
  currentStock: number
  minStock: number
  barcode?: string | null
  unitOfMeasure?: string
  purchasePrice?: number
  sellingPrice?: number
  categoryId?: string
}

interface NewVariation {
  sku: string
  color: string
  size: string
  currentStock: number
}

interface ProductGridModalProps {
  productName: string
  variations: ProductVariation[]
  onSuccess?: () => void
}

export function ProductGridModal({ productName, variations: initialVariations, onSuccess }: ProductGridModalProps) {
  const [variations, setVariations] = useState<ProductVariation[]>(initialVariations)
  const [newVariations, setNewVariations] = useState<NewVariation[]>([])
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setVariations(initialVariations)
  }, [initialVariations])

  const handleFieldChange = (id: string, field: 'color' | 'size', value: string) => {
    setVariations(prev => prev.map(v => 
      v.id === id ? { ...v, [field]: value } : v
    ))
  }

  const handleAddNewRow = () => {
    setNewVariations(prev => [...prev, { sku: '', color: '', size: '', currentStock: 0 }])
  }

  const handleNewFieldChange = (index: number, field: keyof NewVariation, value: string | number) => {
    setNewVariations(prev => prev.map((v, i) => 
      i === index ? { ...v, [field]: field === 'currentStock' ? Number(value) : value } : v
    ))
  }

  const handleRemoveNewRow = (index: number) => {
    setNewVariations(prev => prev.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    if (newVariations.some(v => !v.sku)) {
      alert('Por favor, preencha o SKU de todas as novas variações.')
      return
    }

    setIsSaving(true)
    try {
      // 1. Atualizar variações existentes
      if (variations.length > 0) {
        await api.put('/products/bulk-update', {
          products: variations.map(v => ({
            id: v.id,
            color: v.color,
            size: v.size
          }))
        })
      }

      // 2. Criar novas variações
      if (newVariations.length > 0) {
        // Precisamos de alguns dados base da primeira variação existente para criar as novas
        const baseProduct = initialVariations[0]
        
        for (const nv of newVariations) {
          await api.post('/products', {
            name: productName,
            sku: nv.sku,
            color: nv.color,
            size: nv.size,
            currentStock: nv.currentStock,
            unitOfMeasure: baseProduct.unitOfMeasure || 'UN',
            categoryId: baseProduct.categoryId || '00000000-0000-0000-0000-000000000000',
            purchasePrice: baseProduct.purchasePrice || 0,
            sellingPrice: baseProduct.sellingPrice || 0,
            minStock: baseProduct.minStock || 0,
          })
        }
      }

      alert('Variações salvas com sucesso!')
      setNewVariations([])
      if (onSuccess) {
        onSuccess()
      }
    } catch (error: any) {
      console.error('Erro ao salvar variações:', error)
      alert(error.response?.data?.message || 'Erro ao salvar variações.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <DialogContent className="max-w-5xl">
      <DialogHeader>
        <div className="flex items-center justify-between pr-8">
          <DialogTitle>Grade de Produto: {productName}</DialogTitle>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              size="sm" 
              className="gap-2" 
              onClick={handleAddNewRow}
              disabled={isSaving}
            >
              <Plus size={16} />
              Nova Variação
            </Button>
            <Button 
              size="sm" 
              className="gap-2" 
              onClick={handleSave} 
              disabled={isSaving}
            >
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Salvar Tudo
            </Button>
          </div>
        </div>
      </DialogHeader>
      
      <div className="py-4 max-h-[70vh] overflow-y-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-48">SKU</TableHead>
              <TableHead>Cor</TableHead>
              <TableHead>Tamanho</TableHead>
              <TableHead className="text-right w-32">Estoque</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Variações Existentes */}
            {variations.map((v) => (
              <TableRow key={v.id}>
                <TableCell className="font-mono text-xs font-bold">{v.sku}</TableCell>
                <TableCell>
                  <Input 
                    value={v.color || ''} 
                    onChange={(e) => handleFieldChange(v.id, 'color', e.target.value)}
                    className="h-8 text-xs"
                    placeholder="Cor"
                  />
                </TableCell>
                <TableCell>
                  <Input 
                    value={v.size || ''} 
                    onChange={(e) => handleFieldChange(v.id, 'size', e.target.value)}
                    className="h-8 text-xs font-bold"
                    placeholder="Tam"
                  />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <span className={v.currentStock <= v.minStock ? 'text-destructive font-bold' : ''}>
                      {v.currentStock}
                    </span>
                    {v.currentStock <= v.minStock && (
                      <AlertTriangle size={14} className="text-destructive" />
                    )}
                  </div>
                </TableCell>
                <TableCell></TableCell>
              </TableRow>
            ))}

            {/* Novas Variações */}
            {newVariations.map((nv, index) => (
              <TableRow key={index} className="bg-emerald-50/50">
                <TableCell>
                  <Input 
                    value={nv.sku} 
                    onChange={(e) => handleNewFieldChange(index, 'sku', e.target.value)}
                    className="h-8 text-xs border-emerald-200"
                    placeholder="Novo SKU"
                  />
                </TableCell>
                <TableCell>
                  <Input 
                    value={nv.color} 
                    onChange={(e) => handleNewFieldChange(index, 'color', e.target.value)}
                    className="h-8 text-xs border-emerald-200"
                    placeholder="Cor"
                  />
                </TableCell>
                <TableCell>
                  <Input 
                    value={nv.size} 
                    onChange={(e) => handleNewFieldChange(index, 'size', e.target.value)}
                    className="h-8 text-xs font-bold border-emerald-200"
                    placeholder="Tam"
                  />
                </TableCell>
                <TableCell>
                  <Input 
                    type="number"
                    value={nv.currentStock} 
                    onChange={(e) => handleNewFieldChange(index, 'currentStock', e.target.value)}
                    className="h-8 text-xs text-right border-emerald-200"
                  />
                </TableCell>
                <TableCell>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-destructive"
                    onClick={() => handleRemoveNewRow(index)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </DialogContent>
  )
}
