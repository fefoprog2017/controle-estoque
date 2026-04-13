import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Package, ArrowLeftRight, FileText, Menu, UploadCloud, BrainCircuit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProductsPage } from './pages/Products'
import { MovementsPage } from './pages/Movements'
import { DashboardPage } from './pages/Dashboard'
import { ReportsPage } from './pages/Reports'
import { UploadBasePage } from './pages/UploadBase'
import { ForecastingPage } from './pages/Forecasting'
import { cn } from './lib/utils'
import { CommandPalette } from './components/CommandPalette'

function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation()

  const isActive = (path: string) => location.pathname === path

  return (
    <div className="flex h-screen bg-muted/20">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r flex flex-col">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-primary flex items-center gap-2">
            <Package className="w-6 h-6" />
            Controle de Estoque
          </h2>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link to="/">
            <Button 
              variant="ghost" 
              className={cn(
                "w-full justify-start gap-3",
                isActive('/') && "bg-accent text-accent-foreground font-bold border-l-4 border-primary rounded-l-none"
              )}
            >
              <LayoutDashboard size={20} /> Dashboard
            </Button>
          </Link>
          <Link to="/products">
            <Button 
              variant="ghost" 
              className={cn(
                "w-full justify-start gap-3",
                isActive('/products') && "bg-accent text-accent-foreground font-bold border-l-4 border-primary rounded-l-none"
              )}
            >
              <Package size={20} /> Produtos
            </Button>
          </Link>
          <Link to="/movements">
            <Button 
              variant="ghost" 
              className={cn(
                "w-full justify-start gap-3",
                isActive('/movements') && "bg-accent text-accent-foreground font-bold border-l-4 border-primary rounded-l-none"
              )}
            >
              <ArrowLeftRight size={20} /> Movimentações
            </Button>
          </Link>
          <Link to="/forecasting">
            <Button 
              variant="ghost" 
              className={cn(
                "w-full justify-start gap-3",
                isActive('/forecasting') && "bg-accent text-accent-foreground font-bold border-l-4 border-primary rounded-l-none"
              )}
            >
              <BrainCircuit size={20} className="text-primary" /> Previsão IA
            </Button>
          </Link>
          <Link to="/upload-base">
            <Button 
              variant="ghost" 
              className={cn(
                "w-full justify-start gap-3",
                isActive('/upload-base') && "bg-accent text-accent-foreground font-bold border-l-4 border-primary rounded-l-none"
              )}
            >
              <UploadCloud size={20} /> Subir Base
            </Button>
          </Link>
          <Link to="/reports">
            <Button 
              variant="ghost" 
              className={cn(
                "w-full justify-start gap-3",
                isActive('/reports') && "bg-accent text-accent-foreground font-bold border-l-4 border-primary rounded-l-none"
              )}
            >
              <FileText size={20} /> Relatórios
            </Button>
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-background">
        <header className="h-16 border-b bg-card flex items-center px-8">
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu />
          </Button>
          <div className="ml-auto flex items-center gap-6">
            <CommandPalette />
            <div className="flex items-center gap-3 border-l pl-6">
              <img src="/logo_luartech.png" alt="Luar Tech Logo" className="h-10 w-auto object-contain mix-blend-multiply" />
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-auto">
          {children}
        </div>
        <footer className="h-10 border-t bg-card flex items-center px-8 text-xs text-muted-foreground">
          © {new Date().getFullYear()} Luar Tech. Todos os direitos reservados.
        </footer>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/movements" element={<MovementsPage />} />
          <Route path="/forecasting" element={<ForecastingPage />} />
          <Route path="/upload-base" element={<UploadBasePage />} />
          <Route path="/reports" element={<ReportsPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}
