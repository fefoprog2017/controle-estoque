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
import { AlertTriangle } from 'lucide-react'

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
}

export function ProductGridModal({ productName, variations }: ProductGridModalProps) {
  return (
    <DialogContent className="max-w-3xl">
      <DialogHeader>
        <DialogTitle>Grade de Produto: {productName}</DialogTitle>
      </DialogHeader>
      
      <div className="py-4">
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
                <TableCell>{v.color || '-'}</TableCell>
                <TableCell className="font-bold">{v.size || '-'}</TableCell>
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
