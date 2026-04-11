import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Command } from 'cmdk'
import * as Dialog from '@radix-ui/react-dialog'
import { LayoutDashboard, Package, ArrowLeftRight, FileText, UploadCloud, Search, Plus } from 'lucide-react'

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const runCommand = (command: () => void) => {
    setOpen(false)
    command()
  }

  return (
    <>
      <button 
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground bg-muted/50 border rounded-md hover:bg-muted/80 transition-colors"
      >
        <Search size={14} />
        <span>Buscar...</span>
        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 ml-2">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50 animate-in fade-in duration-300" />
          <Dialog.Content className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] w-full max-w-[500px] bg-card border rounded-xl shadow-2xl z-50 overflow-hidden outline-none animate-in zoom-in-95 duration-200">
            <Command label="Painel de Comandos" className="flex flex-col h-full">
              <div className="flex items-center border-b px-3 h-12">
                <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                <Command.Input 
                  placeholder="Digite um comando..." 
                  className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <Command.List className="max-h-[300px] overflow-y-auto overflow-x-hidden p-2">
                <Command.Empty className="py-6 text-center text-sm">Nenhum resultado encontrado.</Command.Empty>
                
                <Command.Group heading="Navegação" className="text-xs font-medium text-muted-foreground px-2 py-1.5">
                  <div className="space-y-1 mt-1">
                    <Command.Item 
                      className="flex items-center gap-2 px-2 py-2 rounded-md hover:bg-accent aria-selected:bg-accent cursor-pointer text-sm outline-none transition-colors"
                      onSelect={() => runCommand(() => navigate('/'))}
                    >
                      <LayoutDashboard size={18} />
                      <span>Dashboard</span>
                    </Command.Item>
                    <Command.Item 
                      className="flex items-center gap-2 px-2 py-2 rounded-md hover:bg-accent aria-selected:bg-accent cursor-pointer text-sm outline-none transition-colors"
                      onSelect={() => runCommand(() => navigate('/products'))}
                    >
                      <Package size={18} />
                      <span>Produtos</span>
                    </Command.Item>
                    <Command.Item 
                      className="flex items-center gap-2 px-2 py-2 rounded-md hover:bg-accent aria-selected:bg-accent cursor-pointer text-sm outline-none transition-colors"
                      onSelect={() => runCommand(() => navigate('/movements'))}
                    >
                      <ArrowLeftRight size={18} />
                      <span>Movimentações</span>
                    </Command.Item>
                    <Command.Item 
                      className="flex items-center gap-2 px-2 py-2 rounded-md hover:bg-accent aria-selected:bg-accent cursor-pointer text-sm outline-none transition-colors"
                      onSelect={() => runCommand(() => navigate('/upload-base'))}
                    >
                      <UploadCloud size={18} />
                      <span>Subir Base</span>
                    </Command.Item>
                    <Command.Item 
                      className="flex items-center gap-2 px-2 py-2 rounded-md hover:bg-accent aria-selected:bg-accent cursor-pointer text-sm outline-none transition-colors"
                      onSelect={() => runCommand(() => navigate('/reports'))}
                    >
                      <FileText size={18} />
                      <span>Relatórios</span>
                    </Command.Item>
                  </div>
                </Command.Group>

                <div className="my-2 border-t" />

                <Command.Group heading="Ações Rápidas" className="text-xs font-medium text-muted-foreground px-2 py-1.5">
                  <div className="space-y-1 mt-1">
                    <Command.Item 
                        className="flex items-center gap-2 px-2 py-2 rounded-md hover:bg-accent aria-selected:bg-accent cursor-pointer text-sm outline-none transition-colors"
                        onSelect={() => runCommand(() => navigate('/products?action=new'))}
                    >
                        <Plus size={18} className="text-emerald-600" />
                        <span>Cadastrar Novo Produto</span>
                    </Command.Item>
                    <Command.Item 
                        className="flex items-center gap-2 px-2 py-2 rounded-md hover:bg-accent aria-selected:bg-accent cursor-pointer text-sm outline-none transition-colors"
                        onSelect={() => runCommand(() => navigate('/movements?action=new'))}
                    >
                        <Plus size={18} className="text-blue-600" />
                        <span>Registrar Movimentação</span>
                    </Command.Item>
                  </div>
                </Command.Group>
              </Command.List>
            </Command>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  )
}
