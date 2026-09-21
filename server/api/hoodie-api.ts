app.post('/api/merch/hoodie', async (req, res) => {
  const order = await createPrintfulOrder(req.body.design, 'Milla-Empire');
  res.json({ status: 'shipped', tracking: order.id });
});