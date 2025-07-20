const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();
const PORT = 3000;

const DATA_FILE = path.join(__dirname, "livres.json");

app.use(express.json());
app.use(express.static("public")); // Pour servir index.html et les fichiers statiques

// GET : récupérer les livres
app.get("/api/livres", (req, res) => {
  fs.readFile(DATA_FILE, "utf8", (err, data) => {
    if (err) return res.status(500).json({ error: "Erreur de lecture" });
    res.json(JSON.parse(data));
  });
});

// POST : ajouter un livre
// POST : ajouter ou déplacer un livre (remplace l’ancien si même ISBN)
app.post("/api/livres", (req, res) => {
    const nouveauLivre = req.body;
  
    fs.readFile(DATA_FILE, "utf8", (err, data) => {
      if (err) return res.status(500).json({ error: "Erreur de lecture" });
  
      let livres = [];
      try {
        livres = JSON.parse(data);
      } catch (e) {
        return res.status(500).json({ error: "Erreur de parsing JSON" });
      }
  
      // ❌ Supprimer tous les livres ayant le même ISBN
      livres = livres.filter((livre) => livre.isbn !== nouveauLivre.isbn);
  
      // ✅ Ajouter la version à jour (nouvelle colonne)
      livres.push(nouveauLivre);
  
      fs.writeFile(DATA_FILE, JSON.stringify(livres, null, 2), (err) => {
        if (err) return res.status(500).json({ error: "Erreur d’écriture" });
        res.status(200).json(nouveauLivre);
      });
    });
  });
  
app.listen(PORT, () => {
  console.log(`Serveur en écoute sur http://localhost:${PORT}`);
});
