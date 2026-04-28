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
import { AlertTriangle, Save, Loader2 } from 'lucide-react'
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
}

interface ProductGridModalProps {
  productName: string
  variations: ProductVariation[]
  onSuccess?: () => void
}

export function ProductGridModal({ productName, variations: initialVariations, onSuccess }: ProductGridModalProps) {
  const [variations, setVariations] = useState<ProductVariation[]>(initialVariations)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setVariations(initialVariations)
  }, [initialVariations])

  const handleFieldChange = (id: string, field: 'color' | 'size', value: string) => {
    setVariations(prev => prev.map(v => 
      v.id === id ? { ...v, [field]: value } : v
    ))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await api.put('/products/bulk-update', {
        products: variations.map(v => ({
          id: v.id,
          color: v.color,
          size: v.size
        }))
      })
      alert('Variações atualizadas com sucesso!')
      if (onSuccess) {
        onSuccess()
      }
    } catch (error: any) {
      console.error('Erro ao salvar variações:', error)
      alert('Erro ao salvar variações.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <DialogContent className="max-w-4xl">
      <DialogHeader>
        <div className="flex items-center justify-between pr-8">
          <DialogTitle>Grade de Produto: {productName}</DialogTitle>
          <Button 
            size="sm" 
            className="gap-2" 
            onClick={handleSave} 
            disabled={isSaving}
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Salvar Alterações
          </Button>
        </div>
      </DialogHeader>
      
      <div className="py-4 max-h-[70vh] overflow-y-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead>Cor</TableHead>
              <TableHead>Tamanho</TableHead>
              <TableHead className="text-right">Estoque Atual</TableHead>
              <TableHead className="text-right">Estoque Mín.</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {variations.map((v) => (
              <TableRow key={v.id}>
                <TableCell className="font-mono text-xs">{v.sku}</TableCell>
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
                <TableCell className="text-right text-muted-foreground">{v.minStock}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </DialogContent>
  )
}
