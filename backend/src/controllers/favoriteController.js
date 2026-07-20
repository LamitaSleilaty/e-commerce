const { z } = require("zod");
const favoriteService = require("../services/favoriteService");

async function listFavorites(req, res) {
  const favorites = await favoriteService.listFavorites(req.user.id);
  res.json({ favorites });
}

async function addFavorite(req, res) {
  const productId = z.string().uuid().parse(req.body.productId);
  const favorite = await favoriteService.addFavorite(req.user.id, productId);
  res.status(201).json({ favorite });
}

async function removeFavorite(req, res) {
  await favoriteService.removeFavorite(req.user.id, req.params.productId);
  res.status(204).send();
}

module.exports = { listFavorites, addFavorite, removeFavorite };
