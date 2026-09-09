const exchangeService = require('../services/exchangeService');

const currencyController = {
  getCurrencies(req, res) {
    try {
      const list = exchangeService.getSupportedCurrencies();
      return res.json({ success: true, data: list });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  async getRates(req, res) {
    try {
      const base = (req.query.base || 'USD').toUpperCase();
      const rates = await exchangeService.getLiveRates(base);
      return res.json({ success: true, base, rates });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  async convert(req, res) {
    try {
      const { source = 'USD', target = 'EUR', amount = 1 } = req.body;
      const conversion = await exchangeService.convert(source, target, amount);
      return res.json({ success: true, data: conversion });
    } catch (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
  },

  async getHistoricalTrends(req, res) {
    try {
      const source = (req.query.source || 'USD').toUpperCase();
      const target = (req.query.target || 'EUR').toUpperCase();
      const trends = await exchangeService.getHistoricalTrends(source, target);
      return res.json({ success: true, data: trends });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  async getTravelBudget(req, res) {
    try {
      const base = (req.query.base || 'USD').toUpperCase();
      const amount = parseFloat(req.query.amount || 1000);
      const days = parseInt(req.query.days, 10) || 7;
      const budget = await exchangeService.getTravelBudget(base, amount, days);
      return res.json({ success: true, data: budget });
    } catch (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }
};

module.exports = currencyController;
