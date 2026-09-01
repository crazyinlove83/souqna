async function settlePaidOrder(client, orderId) {
  const { rows: items } = await client.query(`SELECT oi.store_id, SUM(oi.subtotal)::numeric gross, s.owner_id FROM order_items oi JOIN stores s ON s.id=oi.store_id WHERE oi.order_id=$1 GROUP BY oi.store_id,s.owner_id`, [orderId]);
  for (const item of items) {
    const setting = await client.query(`SELECT percentage,fixed_fee FROM commission_settings WHERE store_id=$1 AND active=true UNION ALL SELECT $2::numeric,0 WHERE NOT EXISTS (SELECT 1 FROM commission_settings WHERE store_id=$1 AND active=true) LIMIT 1`, [item.store_id, process.env.DEFAULT_COMMISSION_RATE || 0.05]);
    const rate = Number(setting.rows[0].percentage) > 1 ? Number(setting.rows[0].percentage) / 100 : Number(setting.rows[0].percentage);
    const fee = Number(setting.rows[0].fixed_fee); const gross = Number(item.gross); const commission = +(gross * rate + fee).toFixed(2); const net = +(gross - commission).toFixed(2);
    const added = await client.query(`INSERT INTO commissions(order_id,store_id,rate,fixed_fee,amount) VALUES($1,$2,$3,$4,$5) ON CONFLICT(order_id,store_id) DO NOTHING RETURNING id`, [orderId,item.store_id,rate*100,fee,commission]);
    if (!added.rowCount) continue;
    const wallet = await client.query(`INSERT INTO seller_wallets(seller_id,pending_balance,available_balance) VALUES($1,0,$2) ON CONFLICT(seller_id) DO UPDATE SET available_balance=seller_wallets.available_balance + EXCLUDED.available_balance, updated_at=now() RETURNING available_balance`, [item.owner_id,net]);
    await client.query(`INSERT INTO seller_ledger(seller_id,order_id,entry_type,amount,balance_after,description) VALUES($1,$2,'sale',$3,$4,'رصيد بيع بعد رسوم المنصة')`, [item.owner_id,orderId,net,wallet.rows[0].available_balance]);
  }
  await client.query(`UPDATE orders SET payment_status='paid',status='processing',updated_at=now() WHERE id=$1`, [orderId]);
}
module.exports = { settlePaidOrder };
