function validateConversion(req, res, next) {
  const { source, target, amount } = req.body;
  if (!source || typeof source !== 'string') {
    return res.status(400).json({ success: false, error: 'Valid source currency is required' });
  }
  if (!target || typeof target !== 'string') {
    return res.status(400).json({ success: false, error: 'Valid target currency is required' });
  }
  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount < 0) {
    return res.status(400).json({ success: false, error: 'Valid positive amount is required' });
  }
  req.body.amount = parsedAmount;
  next();
}

function validateFavorite(req, res, next) {
  const { source, target } = req.body;
  if (!source || !target) {
    return res.status(400).json({ success: false, error: 'Source and target currencies required' });
  }
  if (source.toUpperCase() === target.toUpperCase()) {
    return res.status(400).json({ success: false, error: 'Source and target currencies must be different' });
  }
  next();
}

module.exports = {
  validateConversion,
  validateFavorite
};
