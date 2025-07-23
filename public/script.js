// JavaScript pour la modale personnalisée
document.addEventListener("DOMContentLoaded", () => {
  const btnOuvrir = document.getElementById("ouvrir-modal-ajout");
  const btnFermer = document.getElementById("fermer-modal-ajout");
  const modal = document.getElementById("modal-ajout");

  btnOuvrir.addEventListener("click", () => {
    modal.style.display = "flex";
  });

  btnFermer.addEventListener("click", () => {
    modal.style.display = "none";
  });

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.style.display = "none";
    }
  });
});

// JavaScript principal de l'application (repris du code existant avec améliorations UI)
document.addEventListener("DOMContentLoaded", async () => {
  let livresApi = [];
  let livresLocaux = [];
  let livres = [];

  // Fonction pour mettre à jour les statistiques
  const updateStats = () => {
    const aLire = livres.filter(l => l.colonne === 'a-lire').length;
    const enCours = livres.filter(l => l.colonne === 'en-cours').length;
    const lu = livres.filter(l => l.colonne === 'lu').length;
    
    document.getElementById('stat-total').textContent = livres.length;
    document.getElementById('stat-a-lire').textContent = aLire;
    document.getElementById('stat-en-cours').textContent = enCours;
    document.getElementById('stat-lu').textContent = lu;
    
    document.getElementById('count-a-lire').textContent = aLire;
    document.getElementById('count-en-cours').textContent = enCours;
    document.getElementById('count-lu').textContent = lu;
  };

  // Fonction pour créer les étoiles de notation
  const createStars = (note) => {
    if (!note) return '';
    let stars = '';
    for (let i = 1; i <= 5; i++) {
      stars += `<i class="fas fa-star ${i <= note ? '' : 'text-muted'}" style="opacity: ${i <= note ? 1 : 0.3}"></i>`;
    }
    return stars;
  };

  const createCard = (livre) => {
    const carte = document.createElement("div");
    carte.className = "book-card mb-2 p-2 border rounded bg-white";
    
    // Amélioration du contenu de la carte
    const starsHtml = livre.note ? `
      <div class="book-rating">
        <div class="stars">${createStars(livre.note)}</div>
        <span class="rating-text">(${livre.note}/5)</span>
      </div>
    ` : '';
    
    carte.innerHTML = `
      <div class="book-title">${livre.title}</div>
      <div class="book-author">par ${livre.author || "Auteur inconnu"}</div>
      ${starsHtml}
    `;
    
    carte.setAttribute("draggable", "true");
    carte.dataset.isbn = livre.isbn;

    carte.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", livre.isbn);
      carte.style.opacity = "0.5";
    });

    carte.addEventListener("dragend", (e) => {
      carte.style.opacity = "1";
    });

    carte.addEventListener("click", () => {
      const noteOptions = [1, 2, 3, 4, 5]
        .map((n) => `<option value="${n}" ${livre.note == n ? "selected" : ""}>${n}</option>`)
        .join("");

      const contenu = `
        <div class="row">
          <div class="col-md-8">
            <h4 style="color: var(--electric-blue); margin-bottom: 1rem;">${livre.title}</h4>
            <p><strong>Auteur :</strong> ${livre.author || "Inconnu"}</p>
            ${livre.subtitle ? `<p><strong>Sous-titre :</strong> ${livre.subtitle}</p>` : ""}
            <p><strong>Pages :</strong> ${livre.pages || "Non spécifié"}</p>
            <p><strong>Publié le :</strong> ${livre.published ? new Date(livre.published).toLocaleDateString() : "Non spécifié"}</p>
            <p><strong>Éditeur :</strong> ${livre.publisher || "Non spécifié"}</p>
            ${livre.website ? `<p><a href="${livre.website}" target="_blank" style="color: var(--electric-blue);"><i class="fas fa-external-link-alt"></i> Voir le site officiel</a></p>` : ""}
          </div>
          <div class="col-md-4">
            <div style="background: var(--gradient-card); padding: 1rem; border-radius: 12px; border: 1px solid var(--card-border);">
              <h6 style="color: var(--text-primary); margin-bottom: 0.5rem;">Statut actuel</h6>
              <span class="badge" style="background: var(--gradient-electric); padding: 0.5rem 1rem;">${livre.colonne === 'a-lire' ? 'À lire' : livre.colonne === 'en-cours' ? 'En cours' : 'Terminé'}</span>
              ${livre.note ? `
                <div style="margin-top: 1rem;">
                  <h6 style="color: var(--text-primary); margin-bottom: 0.5rem;">Note</h6>
                  <div class="stars">${createStars(livre.note)}</div>
                </div>
              ` : ''}
            </div>
          </div>
        </div>
        
        ${livre.description ? `
          <div style="margin: 1.5rem 0;">
            <h6 style="color: var(--text-primary);">Description</h6>
            <p style="color: var(--text-secondary); line-height: 1.6;">${livre.description}</p>
          </div>
        ` : ''}

        <hr style="border-color: var(--card-border); margin: 2rem 0;">
        
        <form id="form-note-${livre.isbn}">
          <div class="row">
            <div class="col-md-6 mb-3">
              <label for="note-${livre.isbn}" class="form-label"><strong>Note (1 à 5)</strong></label>
              <select id="note-${livre.isbn}" class="form-select">${noteOptions}</select>
            </div>
          </div>
          <div class="mb-3">
            <label for="commentaire-${livre.isbn}" class="form-label"><strong>Commentaire</strong></label>
            <textarea id="commentaire-${livre.isbn}" class="form-control" rows="3" placeholder="Vos impressions sur ce livre...">${livre.commentaire || ""}</textarea>
          </div>
          <button type="submit" class="btn btn-success">
            <i class="fas fa-save"></i>
            Enregistrer
          </button>
        </form>
      `;

      document.getElementById("contenuModal").innerHTML = contenu;
      const modal = new bootstrap.Modal(document.getElementById("livreModal"));
      modal.show();

      document.getElementById(`form-note-${livre.isbn}`).addEventListener("submit", async (e) => {
        e.preventDefault();
        const nouvelleNote = parseInt(document.getElementById(`note-${livre.isbn}`).value);
        const nouveauCommentaire = document.getElementById(`commentaire-${livre.isbn}`).value;

        livresLocaux = livresLocaux.map((l) =>
          l.isbn === livre.isbn ? { ...l, note: nouvelleNote, commentaire: nouveauCommentaire } : l
        );

        try {
          await fetch("/api/livres", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(livresLocaux.find((l) => l.isbn === livre.isbn)),
          });
          
          updateAffichage();
          modal.hide();
          
          // Notification de succès
          showNotification("Livre mis à jour avec succès !", "success");
        } catch (error) {
          showNotification("Erreur lors de la mise à jour", "error");
        }
      });
    });

    return carte;
  };

  // Fonction pour afficher une notification
  const showNotification = (message, type = "info") => {
    const notification = document.createElement("div");
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 1rem 1.5rem;
      border-radius: 12px;
      color: white;
      font-weight: 600;
      z-index: 2000;
      animation: slideInRight 0.3s ease;
      background: ${type === 'success' ? 'var(--electric-green)' : type === 'error' ? '#ef4444' : 'var(--electric-blue)'};
      box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    `;
    notification.innerHTML = `<i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'exclamation-triangle' : 'info'}-circle"></i> ${message}`;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = "slideOutRight 0.3s ease";
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  };

  const afficherLivres = (livres) => {
    document.querySelectorAll(".book-column").forEach((col) => {
      // Garder seulement les empty-state
      const emptyState = col.querySelector('.empty-state');
      col.innerHTML = "";
      if (emptyState) col.appendChild(emptyState);
    });
    
    livres.forEach((livre) => {
      const colonne = document.getElementById(livre.colonne || "a-lire");
      const carte = createCard(livre);
      
      // Cacher l'empty-state s'il y a des livres
      const emptyState = colonne.querySelector('.empty-state');
      if (emptyState) emptyState.style.display = 'none';
      
      colonne?.appendChild(carte);
    });
    
    // Afficher l'empty-state pour les colonnes vides
    document.querySelectorAll(".book-column").forEach((col) => {
      const cards = col.querySelectorAll('.book-card');
      const emptyState = col.querySelector('.empty-state');
      if (emptyState) {
        emptyState.style.display = cards.length === 0 ? 'block' : 'none';
      }
    });
    
    updateStats();
  };

  const updateAffichage = () => {
    const isbnLocaux = new Set(livresLocaux.map((l) => l.isbn));
    livres = [
      ...livresLocaux,
      ...livresApi.filter((l) => !isbnLocaux.has(l.isbn))
    ];
    afficherLivres(livres);
  };

  // Chargement des données
  try {
    const resApi = await fetch("https://keligmartin.github.io/api/books.json");
    const dataApi = await resApi.json();
    livresApi = dataApi.map((livre) => ({
      ...livre,
      colonne: livre.colonne || "a-lire",
      note: livre.note ?? null,
      commentaire: livre.commentaire ?? "",
    }));
  } catch (err) {
    console.error("Erreur API distante :", err);
    showNotification("Impossible de charger les livres distants", "error");
  }

  try {
    const resLocal = await fetch("/api/livres");
    livresLocaux = await resLocal.json();
  } catch (err) {
    console.error("Erreur API locale :", err);
    livresLocaux = [];
  }

  updateAffichage();

  // Formulaire d'ajout de livre
  document.getElementById("form-ajout-livre").addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const titre = document.getElementById("titre").value.trim();
    const auteur = document.getElementById("auteur").value.trim();
    
    if (!titre || !auteur) {
      showNotification("Le titre et l'auteur sont obligatoires", "error");
      return;
    }

    const nouveauLivre = {
      isbn: "manuel-" + Date.now(),
      title: titre,
      author: auteur,
      subtitle: document.getElementById("sousTitre").value.trim() || null,
      pages: parseInt(document.getElementById("pages").value) || null,
      published: document.getElementById("published").value || null,
      publisher: document.getElementById("editeur").value.trim() || null,
      description: document.getElementById("description").value.trim() || "",
      website: document.getElementById("lien").value.trim() || null,
      colonne: "a-lire",
      note: null,
      commentaire: "",
    };

    try {
      const res = await fetch("/api/livres", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nouveauLivre),
      });

      if (res.ok) {
        const livreAjoute = await res.json();
        livresLocaux.push(livreAjoute);
        updateAffichage();
        e.target.reset();
        document.getElementById("modal-ajout").style.display = "none";
        showNotification("Livre ajouté avec succès !", "success");
      } else {
        showNotification("Erreur lors de l'ajout du livre", "error");
      }
    } catch (error) {
      showNotification("Erreur de connexion au serveur", "error");
    }
  });

  // Drag & Drop
  document.querySelectorAll(".book-column").forEach((col) => {
    col.addEventListener("dragover", (e) => {
      e.preventDefault();
      col.classList.add("dragover");
    });

    col.addEventListener("dragleave", (e) => {
      if (!col.contains(e.relatedTarget)) {
        col.classList.remove("dragover");
      }
    });

    col.addEventListener("drop", async (e) => {
      e.preventDefault();
      col.classList.remove("dragover");
      
      const isbn = e.dataTransfer.getData("text/plain");
      const carte = document.querySelector(`.book-card[data-isbn='${isbn}']`);
      
      // Cacher l'empty-state
      const emptyState = col.querySelector('.empty-state');
      if (emptyState) emptyState.style.display = 'none';
      
      col.appendChild(carte);

      let livre = livres.find((l) => l.isbn === isbn);
      if (!livre) return;

      const existeDansLocaux = livresLocaux.some((l) => l.isbn === isbn);

      if (!existeDansLocaux) {
        livre = { ...livre, colonne: col.id };
        livresLocaux.push(livre);
      } else {
        livresLocaux = livresLocaux.map((l) =>
          l.isbn === isbn ? { ...l, colonne: col.id } : l
        );
        livre = livresLocaux.find((l) => l.isbn === isbn);
      }

      try {
        await fetch("/api/livres", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(livre),
        });

        updateAffichage();
        showNotification(`Livre déplacé vers "${col.id === 'a-lire' ? 'À lire' : col.id === 'en-cours' ? 'En cours' : 'Terminé'}"`, "success");
      } catch (error) {
        showNotification("Erreur lors du déplacement", "error");
      }
    });
  });

  // Recherche améliorée
  const inputRecherche = document.getElementById("recherche");
  inputRecherche?.addEventListener("input", () => {
    const terme = inputRecherche.value.toLowerCase();
    document.querySelectorAll(".book-card").forEach((carte) => {
      const isbn = carte.dataset.isbn;
      const livre = livres.find((l) => l.isbn === isbn);
      const titre = (livre?.title || "").toLowerCase();
      const auteur = (livre?.author || "").toLowerCase();
      const match = titre.includes(terme) || auteur.includes(terme);
      
      carte.style.display = match ? "block" : "none";
      
      // Animation de highlight
      if (match && terme.length > 0) {
        carte.style.animation = "none";
        setTimeout(() => carte.style.animation = "fadeInUp 0.3s ease", 10);
      }
    });
    
    // Gérer l'affichage des empty-states lors de la recherche
    document.querySelectorAll(".book-column").forEach((col) => {
      const visibleCards = Array.from(col.querySelectorAll('.book-card')).filter(c => c.style.display !== 'none');
      const emptyState = col.querySelector('.empty-state');
      if (emptyState) {
        emptyState.style.display = visibleCards.length === 0 ? 'block' : 'none';
      }
    });
  });

  // Animation d'entrée pour les statistiques
  setTimeout(() => {
    document.querySelectorAll('.stat-number').forEach((el, i) => {
      setTimeout(() => {
        el.style.animation = 'fadeInUp 0.6s ease';
      }, i * 100);
    });
  }, 500);
});

// Styles d'animation supplémentaires
const additionalStyles = document.createElement('style');
additionalStyles.textContent = `
  @keyframes slideInRight {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  
  @keyframes slideOutRight {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
`;
document.head.appendChild(additionalStyles);