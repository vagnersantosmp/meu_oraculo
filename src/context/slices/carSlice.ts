/**
 * Car Slice — manages fuel records and maintenance records.
 *
 * Cross-dependency: addFuel / addMaintenance / updateFuel / updateMaintenance / deleteFuel / deleteMaintenance
 * all need to update the ledger as well. They receive `setLedger` as a setter callback.
 */
import React from 'react';
import * as db from '../../lib/supabaseService';
import type { CarFuel, CarMaintenance, LedgerTransaction } from '../../types';

type SetLedger = React.Dispatch<React.SetStateAction<LedgerTransaction[]>>;

export function createCarSlice(
    userId: string,
    setFuelRecords: React.Dispatch<React.SetStateAction<CarFuel[]>>,
    setMaintenanceRecords: React.Dispatch<React.SetStateAction<CarMaintenance[]>>,
    setLedger: SetLedger,
) {
    const addFuel = (data: Omit<CarFuel, 'id' | 'user_id' | 'created_at'>) => {
        db.createFuelDB(userId, data).then(newFuel => {
            setFuelRecords(prev => [newFuel, ...prev]);
            const txnData = {
                category: 'Combustível', description: `Abastecimento ${data.km} km`,
                value: data.value, type: 'expense' as const, payment_method: data.payment_method,
                source: 'system' as const, source_ref: newFuel.id, date: data.date
            };
            db.createTransaction(userId, txnData).then(txn => {
                setLedger(prev => [txn, ...prev]);
            });
        }).catch(console.error);
    };

    const updateFuel = (id: string, data: Partial<Omit<CarFuel, 'id' | 'user_id' | 'created_at'>>) => {
        setFuelRecords(prev => prev.map(f => {
            if (f.id !== id) return f;
            const updated = { ...f, ...data };
            setLedger(prevLedger => prevLedger.map(t => {
                if (t.source === 'system' && t.source_ref === id) {
                    const updatedTxn = { ...t, value: updated.value, date: updated.date, payment_method: updated.payment_method, description: `Abastecimento ${updated.km} km` };
                    db.updateTransactionDB(t.id, { value: updated.value, date: updated.date, payment_method: updated.payment_method, description: `Abastecimento ${updated.km} km` }).catch(console.error);
                    return updatedTxn;
                }
                return t;
            }));
            return updated;
        }));
        db.updateFuelDB(id, data).catch(console.error);
    };

    const deleteFuel = (id: string) => {
        setFuelRecords(prev => prev.filter(f => f.id !== id));
        setLedger(prev => prev.filter(t => !(t.source === 'system' && t.source_ref === id)));
        db.deleteFuelDB(id).catch(console.error);
        db.deleteTransactionsBySourceRef(id).catch(console.error);
    };

    const addMaintenance = (data: Omit<CarMaintenance, 'id' | 'user_id' | 'created_at'>) => {
        db.createMaintenanceDB(userId, data).then(newMaint => {
            setMaintenanceRecords(prev => [newMaint, ...prev]);
            const txnData = {
                category: 'Manutenções', description: `${data.type} (${data.km_done}km)`,
                value: data.value, type: 'expense' as const, payment_method: data.payment_method,
                source: 'system' as const, source_ref: newMaint.id, date: data.date
            };
            db.createTransaction(userId, txnData).then(txn => {
                setLedger(prev => [txn, ...prev]);
            });
        }).catch(console.error);
    };

    const updateMaintenance = (id: string, data: Partial<Omit<CarMaintenance, 'id' | 'user_id' | 'created_at'>>) => {
        setMaintenanceRecords(prev => prev.map(m => {
            if (m.id !== id) return m;
            const updated = { ...m, ...data };
            setLedger(prevLedger => prevLedger.map(t => {
                if (t.source === 'system' && t.source_ref === id) {
                    const updatedTxn = { ...t, value: updated.value, date: updated.date, payment_method: updated.payment_method, description: `${updated.type} (${updated.km_done}km)` };
                    db.updateTransactionDB(t.id, { value: updated.value, date: updated.date, payment_method: updated.payment_method, description: `${updated.type} (${updated.km_done}km)` }).catch(console.error);
                    return updatedTxn;
                }
                return t;
            }));
            return updated;
        }));
        db.updateMaintenanceDB(id, data).catch(console.error);
    };

    const deleteMaintenance = (id: string) => {
        setMaintenanceRecords(prev => prev.filter(m => m.id !== id));
        setLedger(prev => prev.filter(t => !(t.source === 'system' && t.source_ref === id)));
        db.deleteMaintenanceDB(id).catch(console.error);
        db.deleteTransactionsBySourceRef(id).catch(console.error);
    };

    const getCarAlerts = (fuelRecords: CarFuel[], maintenanceRecords: CarMaintenance[]) => {
        if (maintenanceRecords.length === 0) return null;

        const maxFuelKm = fuelRecords.length > 0 ? Math.max(...fuelRecords.map(f => f.km)) : 0;
        const maxMaintKm = maintenanceRecords.length > 0 ? Math.max(...maintenanceRecords.map(m => m.km_done)) : 0;
        const currentKm = Math.max(maxFuelKm, maxMaintKm);

        if (currentKm === 0) return null;

        let criticalMaintenance: CarMaintenance | null = null;
        let minDiff = Infinity;

        maintenanceRecords.forEach(m => {
            const diff = m.km_next - currentKm;
            if (diff >= 0 && diff < minDiff) { minDiff = diff; criticalMaintenance = m; }
            else if (diff < 0 && minDiff > 0) { minDiff = diff; criticalMaintenance = m; }
            else if (diff < 0 && diff < minDiff) { minDiff = diff; criticalMaintenance = m; }
        });

        if (!criticalMaintenance) return null;

        const kmRestante = minDiff;
        let status: 'OK' | 'ATENÇÃO' | 'URGENTE' = 'OK';
        if (kmRestante <= 300) status = 'URGENTE';
        else if (kmRestante <= 1000) status = 'ATENÇÃO';

        return {
            status, remainingKm: kmRestante,
            nextMaintenanceKm: (criticalMaintenance as CarMaintenance).km_next,
            type: (criticalMaintenance as CarMaintenance).type
        };
    };

    return { addFuel, updateFuel, deleteFuel, addMaintenance, updateMaintenance, deleteMaintenance, getCarAlerts };
}
