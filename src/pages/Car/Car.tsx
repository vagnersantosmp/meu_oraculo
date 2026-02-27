import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Button, Card, Header, Input, Select, Modal } from '../../components/ui';
import { Fuel, Wrench, AlertTriangle, CheckCircle, Plus, Pencil, Trash2 } from 'lucide-react';
import { formatCurrency, formatDate, cn } from '../../lib/utils';
import type { PaymentMethod, CarFuel, CarMaintenance } from '../../types';

export function Car() {
    const {
        fuelRecords, maintenanceRecords,
        addFuel, updateFuel, deleteFuel,
        addMaintenance, updateMaintenance, deleteMaintenance,
        getCarAlerts
    } = useApp();
    const [activeTab, setActiveTab] = useState<'fuel' | 'maintenance'>('fuel');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<CarFuel | CarMaintenance | null>(null);
    const [viewingItem, setViewingItem] = useState<CarFuel | CarMaintenance | null>(null);

    const carAlert = getCarAlerts();

    const handleOpenNew = () => {
        setEditingItem(null);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (item: CarFuel | CarMaintenance) => {
        setEditingItem(item);
        setIsModalOpen(true);
    };

    const handleView = (item: CarFuel | CarMaintenance) => {
        setViewingItem(item);
    };

    // Sort records descending
    const sortedFuel = [...fuelRecords].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const sortedMaintenance = [...maintenanceRecords].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const isMaintenance = (item: any): item is CarMaintenance => {
        return (item as CarMaintenance).type !== undefined;
    };

    return (
        <div className="pb-20">
            <Header title="Meu Carro" />

            <div className="p-4 md:p-6 lg:p-8 space-y-6">

                {/* Status Widget */}
                <section>
                    {carAlert ? (
                        <Card className={cn(
                            "border-l-4",
                            carAlert.status === 'URGENTE' ? "border-l-red-500 bg-red-50 dark:bg-red-900/10" :
                                carAlert.status === 'ATENÇÃO' ? "border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/10" : "border-l-green-500 bg-green-50 dark:bg-green-900/10"
                        )}>
                            <div className="flex items-start gap-3">
                                {carAlert.status === 'URGENTE' || carAlert.status === 'ATENÇÃO' ?
                                    <AlertTriangle className={carAlert.status === 'URGENTE' ? "text-red-600 dark:text-red-400" : "text-yellow-600 dark:text-yellow-400"} /> :
                                    <CheckCircle className="text-green-600 dark:text-green-400" />
                                }
                                <div>
                                    <h4 className="font-bold text-sm text-text-primary">
                                        {carAlert.status === 'OK' ? 'Manutenção em dia' :
                                            carAlert.status === 'URGENTE' ? 'Manutenção Urgente!' : 'Atenção Necessária'}
                                    </h4>
                                    <p className="text-xs text-text-secondary mt-1">
                                        Próxima: {carAlert.type} em {carAlert.remainingKm}km
                                    </p>
                                </div>
                            </div>
                        </Card>
                    ) : (
                        <Card className="bg-muted border-dashed border-2 border-border p-4 text-center text-sm text-text-secondary">
                            Nenhum dado de manutenção
                        </Card>
                    )}
                </section>

                {/* Tabs */}
                <div className="flex rounded-lg bg-muted p-1">
                    <button
                        className={cn("flex-1 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2", activeTab === 'fuel' ? "bg-card shadow-sm text-blue-600 dark:text-blue-400" : "text-text-secondary hover:text-text-primary")}
                        onClick={() => setActiveTab('fuel')}
                    >
                        <Fuel size={16} /> Abastecimentos
                    </button>
                    <button
                        className={cn("flex-1 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2", activeTab === 'maintenance' ? "bg-card shadow-sm text-orange-600 dark:text-orange-400" : "text-text-secondary hover:text-text-primary")}
                        onClick={() => setActiveTab('maintenance')}
                    >
                        <Wrench size={16} /> Manutenções
                    </button>
                </div>

                {/* Action Button */}
                <Button className="w-full" onClick={handleOpenNew}>
                    <Plus size={18} /> Novo Lançamento
                </Button>

                {/* List */}
                <div className="space-y-3">
                    <h3 className="font-semibold text-text-primary">Histórico</h3>

                    {activeTab === 'fuel' ? (
                        sortedFuel.length === 0 ? <p className="text-center text-text-secondary text-sm py-4">Sem registros</p> :
                            sortedFuel.map(fuel => (
                                <Card key={fuel.id} className="flex justify-between items-center cursor-pointer active:scale-[0.99] transition-transform" onClick={() => handleView(fuel)}>
                                    <div className="flex items-center gap-3">
                                        <div className="bg-blue-100 p-2 rounded-full text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"><Fuel size={16} /></div>
                                        <div>
                                            <p className="font-bold text-text-primary">{fuel.km} km</p>
                                            <p className="text-xs text-text-secondary">{formatDate(fuel.date)}</p>
                                        </div>
                                    </div>
                                    <div className="text-right flex flex-col items-end">
                                        <p className="font-bold text-text-primary">{formatCurrency(fuel.value)}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <p className="text-xs text-text-secondary capitalize">{fuel.payment_method}</p>
                                            <div className="flex gap-1">
                                                <button
                                                    className="p-1.5 text-text-secondary hover:text-blue-600 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleOpenEdit(fuel);
                                                    }}
                                                >
                                                    <Pencil size={14} />
                                                </button>
                                                <button
                                                    className="p-1.5 text-text-secondary hover:text-red-600 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (confirm('Excluir abastecimento?')) deleteFuel(fuel.id);
                                                    }}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            ))
                    ) : (
                        sortedMaintenance.length === 0 ? <p className="text-center text-text-secondary text-sm py-4">Sem registros</p> :
                            sortedMaintenance.map(maint => (
                                <Card key={maint.id} className="flex justify-between items-center cursor-pointer active:scale-[0.99] transition-transform" onClick={() => handleView(maint)}>
                                    <div className="flex items-center gap-3">
                                        <div className="bg-orange-100 p-2 rounded-full text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"><Wrench size={16} /></div>
                                        <div>
                                            <p className="font-bold text-text-primary">{maint.type}</p>
                                            <p className="text-xs text-text-secondary">{formatDate(maint.date)} • {maint.km_done} km</p>
                                        </div>
                                    </div>
                                    <div className="text-right flex flex-col items-end">
                                        <p className="font-bold text-text-primary">{formatCurrency(maint.value)}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <p className="text-xs text-text-secondary capitalize">{maint.payment_method}</p>
                                            <div className="flex gap-1">
                                                <button
                                                    className="p-1.5 text-text-secondary hover:text-blue-600 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleOpenEdit(maint);
                                                    }}
                                                >
                                                    <Pencil size={14} />
                                                </button>
                                                <button
                                                    className="p-1.5 text-text-secondary hover:text-red-600 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (confirm('Excluir manutenção?')) deleteMaintenance(maint.id);
                                                    }}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            ))
                    )}
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={
                activeTab === 'fuel'
                    ? (editingItem ? "Editar Abastecimento" : "Novo Abastecimento")
                    : (editingItem ? "Editar Manutenção" : "Nova Manutenção")
            }>
                {activeTab === 'fuel' ? (
                    <FuelForm
                        initialData={editingItem as CarFuel}
                        onClose={() => setIsModalOpen(false)}
                        onSubmit={(data: any) => {
                            if (editingItem) updateFuel(editingItem.id, data);
                            else addFuel(data);
                            setIsModalOpen(false);
                        }}
                        onDelete={editingItem ? () => {
                            if (confirm('Excluir?')) {
                                deleteFuel(editingItem.id);
                                setIsModalOpen(false);
                            }
                        } : undefined}
                    />
                ) : (
                    <MaintenanceForm
                        initialData={editingItem as CarMaintenance}
                        onClose={() => setIsModalOpen(false)}
                        onSubmit={(data: any) => {
                            if (editingItem) updateMaintenance(editingItem.id, data);
                            else addMaintenance(data);
                            setIsModalOpen(false);
                        }}
                        lastKm={sortedFuel[0]?.km || 0}
                        onDelete={editingItem ? () => {
                            if (confirm('Excluir?')) {
                                deleteMaintenance(editingItem.id);
                                setIsModalOpen(false);
                            }
                        } : undefined}
                    />
                )}
            </Modal>

            <Modal isOpen={!!viewingItem} onClose={() => setViewingItem(null)} title="Detalhes do Lançamento">
                {viewingItem && (
                    <div className="space-y-6">
                        <div className="text-center">
                            <div className={cn("mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-3", isMaintenance(viewingItem) ? "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400" : "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400")}>
                                {isMaintenance(viewingItem) ? <Wrench size={24} /> : <Fuel size={24} />}
                            </div>
                            <h2 className="text-xl font-bold text-text-primary">
                                {isMaintenance(viewingItem) ? viewingItem.type : `Abastecimento`}
                            </h2>
                            <p className="text-3xl font-bold mt-2 text-text-primary">
                                {formatCurrency(viewingItem.value)}
                            </p>
                        </div>

                        <div className="bg-muted rounded-xl p-4 space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-text-secondary">Data</span>
                                <span className="font-medium text-text-primary">{formatDate(viewingItem.date)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-text-secondary">Pagamento</span>
                                <span className="font-medium capitalize text-text-primary">{viewingItem.payment_method}</span>
                            </div>
                            {isMaintenance(viewingItem) ? (
                                <>
                                    <div className="flex justify-between">
                                        <span className="text-text-secondary">KM Realizado</span>
                                        <span className="font-medium text-text-primary">{viewingItem.km_done} km</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-text-secondary">Próxima Revisão</span>
                                        <span className="font-medium text-text-primary">{viewingItem.km_next} km</span>
                                    </div>
                                </>
                            ) : (
                                <div className="flex justify-between">
                                    <span className="text-text-secondary">KM Atual</span>
                                    {/* @ts-ignore - we know it's fuel here */}
                                    <span className="font-medium text-text-primary">{viewingItem.km} km</span>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-2">
                            <Button variant="outline" className="flex-1" onClick={() => {
                                setViewingItem(null);
                                handleOpenEdit(viewingItem);
                            }}>
                                <Pencil size={16} /> Editar
                            </Button>
                            <Button variant="danger" className="flex-1 bg-red-100 text-red-600 border-red-200 hover:bg-red-200 dark:bg-red-900/20 dark:border-red-900/30 dark:text-red-400" onClick={() => {
                                if (confirm('Excluir registro?')) {
                                    isMaintenance(viewingItem) ? deleteMaintenance(viewingItem.id) : deleteFuel(viewingItem.id);
                                    setViewingItem(null);
                                }
                            }}>
                                <Trash2 size={16} /> Excluir
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}

function FuelForm({ initialData, onClose, onSubmit, onDelete }: { initialData?: CarFuel, onClose: () => void, onSubmit: any, onDelete?: () => void }) {
    const [km, setKm] = useState('');
    const [value, setValue] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [payment, setPayment] = useState<PaymentMethod>('debito');

    useEffect(() => {
        if (initialData) {
            setKm(initialData.km.toString());
            setValue(initialData.value.toString());
            setDate(initialData.date.split('T')[0]);
            setPayment(initialData.payment_method);
        } else {
            setKm('');
            setValue('');
            setDate(new Date().toISOString().split('T')[0]);
            setPayment('debito');
        }
    }, [initialData]);

    const submit = () => {
        if (!km || !value) return;
        onSubmit({
            km: parseInt(km),
            value: parseFloat(value.replace(',', '.')),
            date,
            payment_method: payment
        });
    };

    return (
        <div className="space-y-4">
            <div>
                <label className="text-xs font-semibold text-text-secondary uppercase">Data</label>
                <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div>
                <label className="text-xs font-semibold text-text-secondary uppercase">KM Atual</label>
                <Input type="number" placeholder="Ex: 58000" value={km} onChange={e => setKm(e.target.value)} />
            </div>
            <div>
                <label className="text-xs font-semibold text-text-secondary uppercase">Valor Total</label>
                <Input type="number" step="0.01" placeholder="Ex: 250,00" value={value} onChange={e => setValue(e.target.value)} />
            </div>
            <div>
                <label className="text-xs font-semibold text-text-secondary uppercase">Pagamento</label>
                <Select value={payment} onChange={e => setPayment(e.target.value as PaymentMethod)}>
                    <option value="dinheiro">Dinheiro</option>
                    <option value="pix">Pix</option>
                    <option value="debito">Débito</option>
                    <option value="credito">Crédito</option>
                </Select>
            </div>

            <div className="flex gap-2 mt-4">
                {onDelete && (
                    <Button type="button" variant="danger" size="icon" onClick={onDelete} className="bg-red-100 hover:bg-red-200 border-red-200 text-red-600 dark:bg-red-900/20 dark:border-red-900/30">
                        <Trash2 size={20} />
                    </Button>
                )}
                <Button type="button" variant="outline" onClick={onClose} className="flex-1 bg-muted border-border text-text-secondary hover:text-text-primary">
                    Cancelar
                </Button>
                <Button className="flex-1" onClick={submit}>
                    Salvar
                </Button>
            </div>
        </div>
    );
}

function MaintenanceForm({ initialData, onClose, onSubmit, lastKm, onDelete }: { initialData?: CarMaintenance, onClose: () => void, onSubmit: any, lastKm: number, onDelete?: () => void }) {
    const [type, setType] = useState('');
    const [kmDone, setKmDone] = useState(lastKm.toString());
    const [kmNext, setKmNext] = useState((lastKm + 10000).toString());
    const [value, setValue] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [payment, setPayment] = useState<PaymentMethod>('debito');

    useEffect(() => {
        if (initialData) {
            setType(initialData.type);
            setKmDone(initialData.km_done.toString());
            setKmNext(initialData.km_next.toString());
            setValue(initialData.value.toString());
            setDate(initialData.date.split('T')[0]);
            setPayment(initialData.payment_method);
        } else {
            setType('');
            setKmDone(lastKm.toString());
            setKmNext((lastKm + 10000).toString());
            setValue('');
            setDate(new Date().toISOString().split('T')[0]);
            setPayment('debito');
        }
    }, [initialData, lastKm]);

    const submit = () => {
        if (!type || !value) return;
        onSubmit({
            type,
            km_done: parseInt(kmDone),
            km_next: parseInt(kmNext),
            value: parseFloat(value.replace(',', '.')),
            date,
            payment_method: payment
        });
    };

    return (
        <div className="space-y-4">
            <div>
                <label className="text-xs font-semibold text-text-secondary uppercase">Tipo</label>
                <Input placeholder="Ex: Troca de Óleo, Pneus..." value={type} onChange={e => setType(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-xs font-semibold text-text-secondary uppercase">KM Realizado</label>
                    <Input type="number" value={kmDone} onChange={e => setKmDone(e.target.value)} />
                </div>
                <div>
                    <label className="text-xs font-semibold text-text-secondary uppercase">Próximo KM</label>
                    <Input type="number" value={kmNext} onChange={e => setKmNext(e.target.value)} />
                </div>
            </div>
            <div>
                <label className="text-xs font-semibold text-text-secondary uppercase">Data</label>
                <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div>
                <label className="text-xs font-semibold text-text-secondary uppercase">Valor</label>
                <Input type="number" step="0.01" value={value} onChange={e => setValue(e.target.value)} />
            </div>
            <div>
                <label className="text-xs font-semibold text-text-secondary uppercase">Pagamento</label>
                <Select value={payment} onChange={e => setPayment(e.target.value as PaymentMethod)}>
                    <option value="dinheiro">Dinheiro</option>
                    <option value="pix">Pix</option>
                    <option value="debito">Débito</option>
                    <option value="credito">Crédito</option>
                </Select>
            </div>

            <div className="flex gap-2 mt-4">
                {onDelete && (
                    <Button type="button" variant="danger" size="icon" onClick={onDelete} className="bg-red-100 hover:bg-red-200 border-red-200 text-red-600 dark:bg-red-900/20 dark:border-red-900/30">
                        <Trash2 size={20} />
                    </Button>
                )}
                <Button type="button" variant="outline" onClick={onClose} className="flex-1 bg-muted border-border text-text-secondary hover:text-text-primary">
                    Cancelar
                </Button>
                <Button className="flex-1" onClick={submit}>
                    Salvar
                </Button>
            </div>
        </div>
    );
}
