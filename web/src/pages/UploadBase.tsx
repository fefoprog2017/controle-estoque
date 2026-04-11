import { useState, useRef } from 'react'
import { UploadCloud, FileText, AlertCircle, Loader2, Trash2, Database } from 'lucide-react'
import { api } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from '@/lib/utils'

interface ExtractedProduct {
  sku: string
  nome: string
  cor: string
  tam: string
  qtd: number
  sellingPrice: number
}

export function UploadBasePage() {
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [extractedData, setExtractedData] = useState<ExtractedProduct[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isDragActive, setIsDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFiles = (files: FileList | null) => {
    if (files && files.length > 0) {
      const selectedFile = files[0]
      if (selectedFile.type === 'application/pdf' || selectedFile.type.startsWith('image/')) {
        setFile(selectedFile)
        setError(null)
        setExtractedData([])
      } else {
        setError('Formato de arquivo não suportado. Use PDF ou Imagem.')
      }
    }
  }

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragActive(true)
  }

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragActive(false)
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragActive(false)
    handleFiles(e.dataTransfer.files)
  }

  async function handleProcessFile() {
    if (!file) return

    setIsProcessing(true)
    setError(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await api.post('/ai/extract-products', formData)

      setExtractedData(response.data.products)
    } catch (err: any) {      setError(err.response?.data?.message || 'Falha ao processar o documento. Verifique se o arquivo está legível.')
    } finally {
      setIsProcessing(false)
    }
  }

  async function handleConfirmInventory() {
    try {
      await api.post('/products/bulk-insert', { products: extractedData })
      alert('Produtos cadastrados com sucesso no estoque!')
      setExtractedData([])
      setFile(null)
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao confirmar cadastro.'
      const errorDetail = err.response?.data?.error || ''
      alert(`${errorMessage}\n${errorDetail}`)
    }
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Subir Base</h1>
        <p className="text-muted-foreground">Importe pedidos em PDF ou Imagem para extração automática via IA.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Lado Esquerdo: Upload */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Upload de Pedido</CardTitle>
            <CardDescription>Arraste o arquivo ou clique para selecionar.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div 
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors min-h-[200px]",
                isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/20 hover:border-primary/50"
              )}
            >
              <input 
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".pdf,image/*"
                onChange={(e) => handleFiles(e.target.files)}
              />
              <UploadCloud className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-sm font-medium text-center">
                {file ? file.name : "Solte o PDF ou Imagem aqui"}
              </p>
              <p className="text-xs text-muted-foreground mt-2 text-center">PDF, PNG ou JPG (máx. 10MB)</p>
            </div>

            {error && (
              <div className="bg-destructive/10 text-destructive p-3 rounded-md flex items-center gap-2 text-sm">
                <AlertCircle size={16} /> {error}
              </div>
            )}

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1" 
                onClick={(e) => { e.stopPropagation(); setFile(null); setExtractedData([]); }}
                disabled={!file || isProcessing}
              >
                <Trash2 size={16} className="mr-2" /> Limpar
              </Button>
              <Button 
                className="flex-1" 
                onClick={(e) => { e.stopPropagation(); handleProcessFile(); }}
                disabled={!file || isProcessing}
              >
                {isProcessing ? <Loader2 className="animate-spin mr-2" size={16} /> : <FileText size={16} className="mr-2" />}
                Extrair Dados
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Lado Direito: Preview da Extração */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Conferência de Dados</CardTitle>
              <CardDescription>Verifique os produtos identificados pela IA antes de salvar.</CardDescription>
            </div>
            {extractedData.length > 0 && (
              <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleConfirmInventory}>
                <Database size={16} className="mr-2" /> Confirmar Cadastro
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {extractedData.length > 0 ? (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SKU</TableHead>
                      <TableHead>Produto</TableHead>
                      <TableHead>Cor/Tam</TableHead>
                      <TableHead>Qtd</TableHead>
                      <TableHead>Preço</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {extractedData.map((prod, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-mono text-xs">{prod.sku}</TableCell>
                        <TableCell className="font-medium">{prod.nome}</TableCell>
                        <TableCell className="text-xs">{prod.cor} / {prod.tam}</TableCell>
                        <TableCell className="font-bold">{prod.qtd}</TableCell>
                        <TableCell>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(prod.sellingPrice)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed rounded-lg bg-muted/10">
                {isProcessing ? (
                  <>
                    <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                    <p className="text-sm text-muted-foreground animate-pulse">A IA está mapeando as colunas do seu documento...</p>
                  </>
                ) : (
                  <>
                    <FileText className="w-10 h-10 text-muted-foreground/30 mb-4" />
                    <p className="text-sm text-muted-foreground text-center px-8">
                      Nenhum dado extraído ainda.<br />Suba um arquivo para ver o preview aqui.
                    </p>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
