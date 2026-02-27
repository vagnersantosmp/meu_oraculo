import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Card, Input, Button, Modal } from '../../components/ui';
import { CurrencyInput } from '../../components/CurrencyInput';
import { AddItemsDialog } from '../../components/AddItemsDialog';
import {
    ArrowLeft,
    Plus,
    Trash2,
    CheckCircle2,
    ShoppingCart,
    ListPlus,
    RotateCcw
} from 'lucide-react';
import { CATEGORIAS, getCategoriaColor } from '../../lib/categorias';

export default function ShoppingDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const {
        shoppingLists,
        addItemToList,
        addMultipleItemsToList,
        updateItemInList,
        deleteItemFromList,
        finalizeShoppingList,
        reopenShoppingList
    } = useApp();

    const [novoItem, setNovoItem] = useState('');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [filterCategoria, setFilterCategoria] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [sortBy, setSortBy] = useState('nome');

    // Finalize Modal State
    const [isFinalizeModalOpen, setIsFinalizeModalOpen] = useState(false);
    const [finalTotalInput, setFinalTotalInput] = useState(0);

    const lista = shoppingLists.find(l => l.id === id);

    const itens = lista?.items || [];

    const itensFiltrados = useMemo(() => {
        let result = [...itens];

        if (filterCategoria !== 'all') {
            result = result.filter(i => i.categoria === filterCategoria);
        }
        if (filterStatus === 'pegos') {
            result = result.filter(i => i.marcado_como_pegado);
        } else if (filterStatus === 'pendentes') {
            result = result.filter(i => !i.marcado_como_pegado);
        }

        if (sortBy === 'nome') {
            result.sort((a, b) => a.nome_item.localeCompare(b.nome_item));
        } else if (sortBy === 'categoria') {
            result.sort((a, b) => a.categoria.localeCompare(b.categoria));
        } else if (sortBy === 'valor') {
            result.sort((a, b) => b.valor_total_item - a.valor_total_item);
        }

        // Checked items always at bottom
        result.sort((a, b) => Number(a.marcado_como_pegado) - Number(b.marcado_como_pegado));

        return result;
    }, [itens, filterCategoria, filterStatus, sortBy]);

    const totalCalculado = useMemo(() => {
        return itens.reduce((acc, item) => acc + (item.valor_total_item || 0), 0);
    }, [itens]);

    const itensPegos = itens.filter(i => i.marcado_como_pegado).length;
    const progresso = itens.length > 0 ? (itensPegos / itens.length) * 100 : 0;

    const adicionarItemRapido = () => {
        if (!novoItem.trim() || !id) return;
        addItemToList(id, novoItem.trim());
        setNovoItem('');
    };

    const adicionarVariosItens = (items: { nome: string; categoria: string }[]) => {
        if (!id) return;
        addMultipleItemsToList(id, items);
        setDialogOpen(false);
    };

    if (!lista) {
        return (
            <div className="p-4 text-center">
                <ShoppingCart className="w-12 h-12 text-text-secondary/50 mx-auto mb-4" />
                <p className="text-text-secondary">Lista não encontrada</p>
                <Button className="mt-4" onClick={() => navigate('/shopping')}>Voltar</Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-card/90 backdrop-blur-md border-b border-border">
                <div className="px-4 md:px-6 lg:px-8 py-3">
                    <div className="flex items-center gap-3">
                        <button
                            className="p-2 rounded-lg hover:bg-muted transition-colors"
                            onClick={() => navigate('/shopping')}
                        >
                            <ArrowLeft className="w-5 h-5 text-text-primary" />
                        </button>
                        <div className="flex-1 min-w-0">
                            <h1 className="text-lg font-bold text-text-primary truncate">{lista.nome_lista}</h1>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-text-secondary">{itens.length} itens</span>
                                {lista.status === 'finalizada' && (
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 font-medium">
                                        Finalizada
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Progress bar */}
                    {itens.length > 0 && lista.status === 'aberta' && (
                        <div className="mt-3">
                            <div className="flex justify-between text-xs text-text-secondary mb-1">
                                <span>{itensPegos} de {itens.length} pegos</span>
                                <span>{Math.round(progresso)}%</span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-green-500 transition-all duration-300 rounded-full"
                                    style={{ width: `${progresso}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </header>

            <main className="flex-1 overflow-y-auto px-4 md:px-6 lg:px-8 py-4 pb-32 space-y-4">
                {/* Quick add */}
                {lista.status === 'aberta' && (
                    <div className="flex gap-2">
                        <Input
                            placeholder="Adicionar item..."
                            value={novoItem}
                            onChange={(e) => setNovoItem(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && adicionarItemRapido()}
                            className="flex-1"
                        />
                        <Button size="sm" onClick={adicionarItemRapido}>
                            <Plus className="w-5 h-5" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setDialogOpen(true)}>
                            <ListPlus className="w-5 h-5" />
                        </Button>
                        <AddItemsDialog
                            open={dialogOpen}
                            onOpenChange={setDialogOpen}
                            onAddItems={adicionarVariosItens}
                        />
                    </div>
                )}

                {/* Filters */}
                {itens.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto pb-1">
                        <select
                            value={filterCategoria}
                            onChange={(e) => setFilterCategoria(e.target.value)}
                            className="h-8 text-xs rounded-lg border border-border bg-card text-text-primary px-2 min-w-[120px]"
                        >
                            <option value="all">Todas categorias</option>
                            {CATEGORIAS.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="h-8 text-xs rounded-lg border border-border bg-card text-text-primary px-2 min-w-[100px]"
                        >
                            <option value="all">Todos</option>
                            <option value="pendentes">Pendentes</option>
                            <option value="pegos">Pegos</option>
                        </select>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="h-8 text-xs rounded-lg border border-border bg-card text-text-primary px-2 min-w-[100px]"
                        >
                            <option value="nome">Nome</option>
                            <option value="categoria">Categoria</option>
                            <option value="valor">Valor</option>
                        </select>
                    </div>
                )}

                {/* Items list */}
                {itensFiltrados.length === 0 ? (
                    <Card className="p-8 text-center border-dashed">
                        <ShoppingCart className="w-12 h-12 text-text-secondary/50 mx-auto mb-4" />
                        <p className="text-text-secondary">Nenhum item na lista</p>
                        <p className="text-xs text-text-secondary/70 mt-1">Adicione itens acima para começar</p>
                    </Card>
                ) : (
                    <div className="space-y-2">
                        {itensFiltrados.map((item) => (
                            <Card
                                key={item.id}
                                className={`p-3 transition-all duration-200 ${item.marcado_como_pegado ? 'bg-green-50/50 dark:bg-green-900/10 border-green-200/50 dark:border-green-800/30' : ''
                                    }`}
                            >
                                {/* Row 1: Checkbox + Name + Category + Delete */}
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={item.marcado_como_pegado}
                                        onChange={() => id && updateItemInList(id, item.id, { marcado_como_pegado: !item.marcado_como_pegado })}
                                        disabled={lista.status === 'finalizada'}
                                        className="w-5 h-5 rounded accent-primary flex-shrink-0"
                                    />
                                    <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
                                        <span className={`font-medium text-sm ${item.marcado_como_pegado ? 'line-through text-text-secondary' : 'text-text-primary'}`}>
                                            {item.nome_item}
                                        </span>
                                        {lista.status === 'aberta' ? (
                                            <select
                                                value={item.categoria}
                                                onChange={(e) => id && updateItemInList(id, item.id, { categoria: e.target.value })}
                                                className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium border-0 cursor-pointer ${getCategoriaColor(item.categoria)}`}
                                            >
                                                {CATEGORIAS.map(cat => (
                                                    <option key={cat} value={cat}>{cat}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${getCategoriaColor(item.categoria)}`}>
                                                {item.categoria}
                                            </span>
                                        )}
                                    </div>
                                    {lista.status === 'aberta' && (
                                        <button
                                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex-shrink-0"
                                            onClick={() => id && deleteItemFromList(id, item.id)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>

                                {/* Row 2: Quantity, Unit, Price, Total */}
                                <div className="flex items-center gap-2 mt-2 ml-8 flex-wrap">
                                    {lista.status === 'aberta' ? (
                                        <>
                                            <input
                                                type="number"
                                                inputMode="decimal"
                                                value={item.quantidade}
                                                onChange={(e) => id && updateItemInList(id, item.id, { quantidade: parseFloat(e.target.value) || 0 })}
                                                className="h-8 w-14 text-sm text-center rounded-lg border border-border bg-card text-text-primary"
                                                step="0.5"
                                                min="0"
                                            />
                                            <select
                                                value={item.unidade_medida}
                                                onChange={(e) => id && updateItemInList(id, item.id, { unidade_medida: e.target.value })}
                                                className="h-8 w-16 text-sm rounded-lg border border-border bg-card text-text-primary px-1"
                                            >
                                                <option value="un">un</option>
                                                <option value="kg">kg</option>
                                                <option value="g">g</option>
                                                <option value="L">L</option>
                                                <option value="ml">ml</option>
                                                <option value="pct">pct</option>
                                                <option value="cx">cx</option>
                                            </select>
                                            <span className="text-text-secondary text-sm">×</span>
                                            <CurrencyInput
                                                value={item.valor_unitario}
                                                onChange={(v) => id && updateItemInList(id, item.id, { valor_unitario: v })}
                                                className="h-8 w-24 text-sm"
                                            />
                                            <span className="text-text-secondary text-sm">=</span>
                                            <span className="text-sm font-semibold text-primary whitespace-nowrap">
                                                R$ {item.valor_total_item.toFixed(2).replace('.', ',')}
                                            </span>
                                        </>
                                    ) : (
                                        <div className="flex items-center gap-2 text-sm text-text-secondary">
                                            <span>{item.quantidade} {item.unidade_medida}</span>
                                            {item.valor_unitario > 0 && (
                                                <>
                                                    <span>× R$ {item.valor_unitario.toFixed(2).replace('.', ',')}</span>
                                                    <span className="font-semibold text-primary">
                                                        = R$ {item.valor_total_item.toFixed(2).replace('.', ',')}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </main>

            {/* Bottom bar */}
            <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-card/95 backdrop-blur-md border-t border-border z-40">
                <div className="px-4 md:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between max-w-5xl mx-auto">
                        <div>
                            <p className="text-sm text-text-secondary">Total da compra</p>
                            <p className="text-2xl font-bold text-primary">
                                R$ {totalCalculado.toFixed(2).replace('.', ',')}
                            </p>
                        </div>
                        {lista.status === 'aberta' && itens.length > 0 && (
                            <Button onClick={() => { setFinalTotalInput(totalCalculado); setIsFinalizeModalOpen(true); }}>
                                <CheckCircle2 className="w-5 h-5 mr-2" />
                                Finalizar compra
                            </Button>
                        )}
                        {lista.status === 'finalizada' && (
                            <Button variant="ghost" onClick={() => id && reopenShoppingList(id)}>
                                <RotateCcw className="w-5 h-5 mr-2" />
                                Reabrir lista
                            </Button>
                        )}
                    </div>
                </div>
            </div>


            {/* Finalize Confirmation Modal */}
            <Modal isOpen={isFinalizeModalOpen} onClose={() => setIsFinalizeModalOpen(false)} title="Finalizar Compra">
                <div className="space-y-4">
                    <p className="text-sm text-text-secondary">
                        Confirme o valor total da compra para lançar no caixa.
                        <br />
                        <span className="text-xs opacity-70"> (O valor dos itens somados é R$ {totalCalculado.toFixed(2)})</span>
                    </p>

                    <div>
                        <label className="text-xs font-medium text-text-secondary mb-1 block">Valor Final (Nota Fiscal)</label>
                        <CurrencyInput
                            value={finalTotalInput}
                            onChange={setFinalTotalInput}
                            className="text-xl py-3"
                        />
                    </div>

                    <div className="flex gap-2 justify-end mt-4">
                        <Button variant="ghost" onClick={() => setIsFinalizeModalOpen(false)}>Cancelar</Button>
                        <Button
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => {
                                if (id) finalizeShoppingList(id, finalTotalInput);
                                setIsFinalizeModalOpen(false);
                                navigate('/shopping'); // Go back to list after finalizing? Or stay? Stay is fine.
                            }}
                        >
                            Confirmar
                        </Button>
                    </div>
                </div>
            </Modal>
        </div >
    );
}
