import Database from 'better-sqlite3';
const db = new Database('ami_smart_meter.db');

try {
    // Ensure columns exist first
    const columns = [
        { name: 'lifecycleStatus', type: "TEXT DEFAULT 'installed'" },
        { name: 'serialNumber', type: 'TEXT' },
        { name: 'batchId', type: 'TEXT' },
        { name: 'supplier', type: 'TEXT' },
        { name: 'purchaseDate', type: 'TEXT' },
        { name: 'warehouseLocation', type: 'TEXT' }
    ];

    columns.forEach(col => {
        try {
            db.exec(`ALTER TABLE meters ADD COLUMN ${col.name} ${col.type}`);
        } catch (e) {
            // Column might already exist
        }
    });

    const stockCount = db.prepare("SELECT COUNT(*) as count FROM meters WHERE lifecycleStatus = 'in_stock'").get().count;
    if (stockCount === 0) {
        console.log('Seeding warehouse meters...');
        const seedWarehouse = [
            { id: '542-001-001', serialNumber: 'SN-NIG-2026-001', batchId: 'BATCH-2026-A', supplier: 'Itron France', purchaseDate: '2026-01-05', lifecycleStatus: 'in_stock', warehouseLocation: 'Magasin Central Niamey - Rayon A' },
            { id: '542-001-002', serialNumber: 'SN-NIG-2026-002', batchId: 'BATCH-2026-A', supplier: 'Itron France', purchaseDate: '2026-01-05', lifecycleStatus: 'in_stock', warehouseLocation: 'Magasin Central Niamey - Rayon A' },
            { id: '542-001-003', serialNumber: 'SN-NIG-2026-003', batchId: 'BATCH-2026-A', supplier: 'Itron France', purchaseDate: '2026-01-05', lifecycleStatus: 'in_stock', warehouseLocation: 'Magasin Central Niamey - Rayon B' },
            { id: '542-001-004', serialNumber: 'SN-NIG-2026-004', batchId: 'BATCH-2026-B', supplier: 'Landis+Gyr', purchaseDate: '2026-02-10', lifecycleStatus: 'in_stock', warehouseLocation: 'Magasin Maradi' },
            { id: '542-001-005', serialNumber: 'SN-NIG-2026-005', batchId: 'BATCH-2026-B', supplier: 'Landis+Gyr', purchaseDate: '2026-02-10', lifecycleStatus: 'faulty', warehouseLocation: 'Zone Réparation Niamey' }
        ];

        const insertMeter = db.prepare(`
      INSERT OR REPLACE INTO meters(id, customerId, location, type, credit, status, lastUpdate, power, voltage, firmware, installationDate, lifecycleStatus, serialNumber, batchId, supplier, purchaseDate, warehouseLocation)
      VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

        seedWarehouse.forEach(m => insertMeter.run(m.id, null, 'Magasin', 'domestic', 0, 'offline', 'N/A', 0, 0, 'v1.0.0', null, m.lifecycleStatus, m.serialNumber, m.batchId, m.supplier, m.purchaseDate, m.warehouseLocation));
        console.log('Warehouse seeded successfully.');
    } else {
        console.log('Warehouse already seeded.');
    }
} catch (e) {
    console.error('Error seeding warehouse:', e);
} finally {
    db.close();
}
