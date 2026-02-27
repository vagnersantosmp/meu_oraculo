import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Modal, Input, Button } from './ui';
import { Search, Plus, Package } from 'lucide-react';
import { CATEGORIAS_CATALOGO, getCategoriaColor } from '../lib/categorias';

interface AddItemsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onAddItems: (items: { nome: string; categoria: string }[]) => void;
}

export function AddItemsDialog({ open, onOpenChange, onAddItems }: AddItemsDialogProps) {
    const { productCatalog, addProductToCatalog } = useApp();
    const [activeTab, setActiveTab] = useState<'catalogo' | 'manual'>('catalogo');
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [searchTerm, setSearchTerm] = useState('');
    const [itemsTexto, setItemsTexto] = useState('');
    const [novoProdutoNome, setNovoProdutoNome] = useState('');
    const [novoProdutoCategoria, setNovoProdutoCategoria] = useState('Mercearia');
    const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());

    const produtosFiltrados = useMemo(() => {
        if (!searchTerm) return productCatalog;
        const term = searchTerm.toLowerCase();
        return productCatalog.filter(p =>
            p.nome_produto.toLowerCase().includes(term) ||
            p.categoria.toLowerCase().includes(term)
        );
    }, [productCatalog, searchTerm]);

    const produtosPorCategoria = useMemo(() => {
        const grouped: Record<string, typeof productCatalog> = {};
        produtosFiltrados.forEach(p => {
            if (!grouped[p.categoria]) grouped[p.categoria] = [];
            grouped[p.categoria].push(p);
        });
        return grouped;
    }, [produtosFiltrados]);

    const categoriasOrdenadas = useMemo(() => {
        return Object.keys(produtosPorCategoria).sort((a, b) => a.localeCompare(b));
    }, [produtosPorCategoria]);

    const toggleItem = (produtoId: string) => {
        const newSelected = new Set(selectedItems);
        if (newSelected.has(produtoId)) newSelected.delete(produtoId);
        else newSelected.add(produtoId);
        setSelectedItems(newSelected);
    };

    const toggleCategory = (cat: string) => {
        const newExpanded = new Set(expandedCats);
        if (newExpanded.has(cat)) newExpanded.delete(cat);
        else newExpanded.add(cat);
        setExpandedCats(newExpanded);
    };

    const handleAddCustomProduct = () => {
        if (!novoProdutoNome.trim()) return;
        const existing = productCatalog.find(p => p.nome_produto.toLowerCase() === novoProdutoNome.trim().toLowerCase());
        if (existing) {
            setSelectedItems(prev => new Set([...prev, existing.id]));
            setNovoProdutoNome('');
            return;
        }
        const newProduct = addProductToCatalog(novoProdutoNome, novoProdutoCategoria);
        setSelectedItems(prev => new Set([...prev, newProduct.id]));
        setNovoProdutoNome('');
    };

    const handleAddFromCatalog = () => {
        if (selectedItems.size === 0) return;
        const itemsToAdd = productCatalog
            .filter(p => selectedItems.has(p.id))
            .map(p => ({ nome: p.nome_produto, categoria: p.categoria }));
        onAddItems(itemsToAdd);
        setSelectedItems(new Set());
        onOpenChange(false);
    };

    const handleAddFromText = () => {
        const linhas = itemsTexto.split('\n').filter(l => l.trim());
        if (linhas.length === 0) return;
        const itemsToAdd = linhas.map(linha => ({ nome: linha.trim(), categoria: '' }));
        onAddItems(itemsToAdd);
        setItemsTexto('');
        onOpenChange(false);
    };

    const handleClose = () => {
        setSelectedItems(new Set());
        setSearchTerm('');
        setItemsTexto('');
        onOpenChange(false);
    };

    return (
        <Modal isOpen={open} onClose={handleClose} title="Adicionar itens">
            {/* Tabs */}
            <div className="flex bg-muted rounded-lg p-1 mb-4">
                <button
                    className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${activeTab === 'catalogo' ? 'bg-card text-text-primary shadow-sm' : 'text-text-secondary'}`}
                    onClick={() => setActiveTab('catalogo')}
                >
                    Por Categoria
                </button>
                <button
                    className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${activeTab === 'manual' ? 'bg-card text-text-primary shadow-sm' : 'text-text-secondary'}`}
                    onClick={() => setActiveTab('manual')}
                >
                    Digitar Manual
                </button>
            </div>

            {activeTab === 'catalogo' ? (
                <div className="space-y-3">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                        <Input
                            placeholder="Buscar produto..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9"
                        />
                    </div>

                    {/* Category Accordion */}
                    <div className="max-h-[40vh] overflow-y-auto space-y-1 pr-1">
                        {categoriasOrdenadas.length === 0 ? (
                            <div className="text-center py-8 text-text-secondary">
                                <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                <p>Nenhum produto no catálogo</p>
                                <p className="text-xs mt-1">Adicione produtos abaixo</p>
                            </div>
                        ) : (
                            categoriasOrdenadas.map(categoria => (
                                <div key={categoria} className="border border-border rounded-lg overflow-hidden">
                                    <button
                                        className="w-full flex items-center justify-between p-3 bg-card hover:bg-muted transition-colors"
                                        onClick={() => toggleCategory(categoria)}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getCategoriaColor(categoria)}`}>
                                                {categoria}
                                            </span>
                                            <span className="text-xs text-text-secondary">
                                                ({produtosPorCategoria[categoria].length})
                                            </span>
                                        </div>
                                        <span className="text-text-secondary text-sm">{expandedCats.has(categoria) ? '▲' : '▼'}</span>
                                    </button>
                                    {expandedCats.has(categoria) && (
                                        <div className="grid grid-cols-2 gap-1 p-2 bg-muted/50">
                                            {produtosPorCategoria[categoria].map(produto => (
                                                <label
                                                    key={produto.id}
                                                    className="flex items-center gap-2 p-2 rounded-md hover:bg-card cursor-pointer transition-colors text-sm"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedItems.has(produto.id)}
                                                        onChange={() => toggleItem(produto.id)}
                                                        className="rounded accent-primary"
                                                    />
                                                    <span className="truncate text-text-primary">{produto.nome_produto}</span>
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    {/* Add custom product */}
                    <div className="border-t border-border pt-3">
                        <p className="text-xs text-text-secondary mb-2">Não encontrou? Adicione ao catálogo:</p>
                        <div className="flex gap-2">
                            <Input
                                placeholder="Nome do produto"
                                value={novoProdutoNome}
                                onChange={(e) => setNovoProdutoNome(e.target.value)}
                                className="flex-1"
                            />
                            <select
                                value={novoProdutoCategoria}
                                onChange={(e) => setNovoProdutoCategoria(e.target.value)}
                                className="h-9 rounded-lg border border-border bg-card text-text-primary text-sm px-2"
                            >
                                {CATEGORIAS_CATALOGO.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                            <Button size="sm" onClick={handleAddCustomProduct}>
                                <Plus className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Selected count + add */}
                    <div className="flex items-center justify-between pt-2">
                        <span className="text-sm text-text-secondary">
                            {selectedItems.size} {selectedItems.size === 1 ? 'item selecionado' : 'itens selecionados'}
                        </span>
                        <Button onClick={handleAddFromCatalog} disabled={selectedItems.size === 0}>
                            Adicionar à lista
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    <textarea
                        placeholder={"Digite um item por linha:\nArroz 5kg\nFeijão\nLeite\n..."}
                        value={itemsTexto}
                        onChange={(e) => setItemsTexto(e.target.value)}
                        className="w-full min-h-[200px] rounded-lg border border-border bg-card text-text-primary p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    <Button className="w-full" onClick={handleAddFromText}>
                        Adicionar itens
                    </Button>
                </div>
            )}
        </Modal>
    );
}
