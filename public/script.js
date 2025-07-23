// État de l'application
let appState = {
  books: [],
  columns: [
      { id: 'to-read', name: 'À lire', color: '#3498db' },
      { id: 'reading', name: 'En cours', color: '#f39c12' },
      { id: 'read', name: 'Lu', color: '#2ecc71' }
  ],
  currentBookId: null,
  draggedBook: null
};

// Initialisation de l'application
document.addEventListener('DOMContentLoaded', function() {
  initializeApp();
  setupEventListeners();
  addExtraButtons();
});

// Fonction d'initialisation avec gestion asynchrone
async function initializeApp() {
  showLoader();
  
  try {
      // Charger les données depuis le localStorage
      loadDataFromStorage();
      
      // Si aucune donnée, charger des livres par défaut
      if (appState.books.length === 0) {
          await loadDefaultBooks();
      }
      
      // Afficher les colonnes et les livres
      renderColumns();
      
      // Vérifier le mode sombre
      if (localStorage.getItem('darkMode') === 'true') {
          document.body.classList.add('dark-mode');
      }
      
      // Afficher un message de bienvenue
      showMessage('Bienvenue dans votre bibliothèque en ligne !', 'info');
  } catch (error) {
      showMessage('Erreur lors du chargement des données', 'error');
      console.error('Erreur d\'initialisation:', error);
  } finally {
      hideLoader();
  }
}

// Charger des livres par défaut (peut être remplacé par un fetch réel)
async function loadDefaultBooks() {
  try {
      // Option 1: Charger depuis le fichier livres.json local
      const response = await fetch('./livres.json');
      if (response.ok) {
          const data = await response.json();
          appState.books = data;
          saveDataToStorage();
          return;
      }
  } catch (error) {
      console.log('Fichier livres.json non trouvé, utilisation des données par défaut');
  }

  // Option 2: Utiliser des données par défaut
  return new Promise((resolve) => {
      setTimeout(() => {
          const defaultBooks = [
              {
                  id: generateId(),
                  title: 'Le Petit Prince',
                  author: 'Antoine de Saint-Exupéry',
                  isbn: '978-2070612758',
                  column: 'read',
                  rating: 5,
                  comment: 'Un chef-d\'œuvre intemporel'
              },
              {
                  id: generateId(),
                  title: '1984',
                  author: 'George Orwell',
                  isbn: '978-2070368228',
                  column: 'to-read',
                  rating: 0,
                  comment: ''
              },
              {
                  id: generateId(),
                  title: 'Harry Potter à l\'école des sorciers',
                  author: 'J.K. Rowling',
                  isbn: '978-2070584628',
                  column: 'reading',
                  rating: 4.5,
                  comment: 'Relecture nostalgique'
              }
          ];
          
          appState.books = defaultBooks;
          saveDataToStorage();
          resolve();
      }, 1000);
  });
}

// Gestion du localStorage
function saveDataToStorage() {
  try {
      localStorage.setItem('libraryAppState', JSON.stringify(appState));
  } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      showMessage('Erreur lors de la sauvegarde des données', 'error');
  }
}

function loadDataFromStorage() {
  try {
      const savedData = localStorage.getItem('libraryAppState');
      if (savedData) {
          const parsedData = JSON.parse(savedData);
          appState = { ...appState, ...parsedData };
      }
  } catch (error) {
      console.error('Erreur lors du chargement:', error);
      showMessage('Erreur lors du chargement des données', 'error');
  }
}

// Rendu des colonnes
function renderColumns() {
  const container = document.getElementById('columnsContainer');
  container.innerHTML = '';
  
  appState.columns.forEach(column => {
      const columnEl = createColumnElement(column);
      container.appendChild(columnEl);
  });
}

// Création d'un élément colonne
function createColumnElement(column) {
  const columnEl = document.createElement('div');
  columnEl.className = 'column';
  columnEl.dataset.columnId = column.id;
  columnEl.style.borderTop = `4px solid ${column.color}`;
  
  // Gestion du drag over
  columnEl.addEventListener('dragover', handleDragOver);
  columnEl.addEventListener('drop', handleDrop);
  columnEl.addEventListener('dragleave', handleDragLeave);
  
  const booksInColumn = appState.books.filter(book => book.column === column.id);
  
  columnEl.innerHTML = `
      <div class="column-header">
          <h3 class="column-title">${column.name}</h3>
          <span class="column-count">${booksInColumn.length}</span>
      </div>
      <div class="books-container" id="books-${column.id}">
          ${booksInColumn.map(book => createBookCard(book)).join('')}
      </div>
  `;
  
  return columnEl;
}

// Création d'une carte de livre
function createBookCard(book) {
  const stars = generateStars(book.rating);
  return `
      <div class="book-card" draggable="true" data-book-id="${book.id}" 
           ondragstart="handleDragStart(event)" ondragend="handleDragEnd(event)">
          <div class="book-title">${book.title}</div>
          <div class="book-author">${book.author}</div>
          ${book.rating ? `<div class="book-rating">${stars}</div>` : ''}
          <div class="book-actions">
              <button class="book-btn book-btn-info" onclick="showBookDetails('${book.id}')">
                  📖 Détails
              </button>
              <button class="book-btn book-btn-move" onclick="showMoveOptions('${book.id}')">
                  📍 Déplacer
              </button>
          </div>
      </div>
  `;
}

// Génération des étoiles
function generateStars(rating) {
  let stars = '';
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;
  
  for (let i = 0; i < fullStars; i++) {
      stars += '<span class="star">★</span>';
  }
  if (hasHalfStar) {
      stars += '<span class="star">☆</span>';
  }
  
  return stars;
}

// Gestion du Drag & Drop
function handleDragStart(event) {
  const bookId = event.target.dataset.bookId;
  appState.draggedBook = appState.books.find(book => book.id === bookId);
  event.target.classList.add('dragging');
}

function handleDragEnd(event) {
  event.target.classList.remove('dragging');
  appState.draggedBook = null;
}

function handleDragOver(event) {
  event.preventDefault();
  event.currentTarget.classList.add('drag-over');
}

function handleDragLeave(event) {
  if (event.target.classList.contains('column')) {
      event.target.classList.remove('drag-over');
  }
}

function handleDrop(event) {
  event.preventDefault();
  const column = event.currentTarget;
  column.classList.remove('drag-over');
  
  if (appState.draggedBook) {
      const columnId = column.dataset.columnId;
      const bookIndex = appState.books.findIndex(book => book.id === appState.draggedBook.id);
      
      if (bookIndex !== -1) {
          appState.books[bookIndex].column = columnId;
          saveDataToStorage();
          renderColumns();
          showMessage(`Livre déplacé vers ${appState.columns.find(c => c.id === columnId).name}`, 'success');
      }
  }
}

// Affichage des détails d'un livre
function showBookDetails(bookId) {
  const book = appState.books.find(b => b.id === bookId);
  if (!book) return;
  
  const content = document.getElementById('bookDetailsContent');
  content.innerHTML = `
      <div class="form-group">
          <strong>Titre:</strong> ${book.title}
      </div>
      <div class="form-group">
          <strong>Auteur:</strong> ${book.author}
      </div>
      ${book.isbn ? `<div class="form-group"><strong>ISBN:</strong> ${book.isbn}</div>` : ''}
      <div class="form-group">
          <strong>Colonne:</strong> ${appState.columns.find(c => c.id === book.column).name}
      </div>
      ${book.rating ? `<div class="form-group"><strong>Note:</strong> ${generateStars(book.rating)} (${book.rating}/5)</div>` : ''}
      ${book.comment ? `<div class="form-group"><strong>Commentaire:</strong><br>${book.comment}</div>` : ''}
      <div class="form-group">
          <button class="btn btn-primary" onclick="editBook('${book.id}')">
              ✏️ Modifier
          </button>
          <button class="btn btn-secondary" onclick="deleteBook('${book.id}')" style="margin-left: 0.5rem;">
              🗑️ Supprimer
          </button>
      </div>
  `;
  
  document.getElementById('bookDetailsTitle').textContent = book.title;
  showModal('bookDetailsModal');
}

// Options de déplacement rapide
function showMoveOptions(bookId) {
  const book = appState.books.find(b => b.id === bookId);
  if (!book) return;
  
  const otherColumns = appState.columns.filter(c => c.id !== book.column);
  
  if (otherColumns.length === 0) {
      showMessage('Aucune autre colonne disponible', 'info');
      return;
  }
  
  const columnName = prompt(
      `Déplacer vers quelle colonne ?\n${otherColumns.map((c, i) => `${i + 1}. ${c.name}`).join('\n')}`
  );
  
  if (columnName) {
      const targetColumn = otherColumns.find((c, i) => 
          c.name.toLowerCase() === columnName.toLowerCase() || 
          (i + 1).toString() === columnName
      );
      
      if (targetColumn) {
          book.column = targetColumn.id;
          saveDataToStorage();
          renderColumns();
          showMessage(`Livre déplacé vers ${targetColumn.name}`, 'success');
      } else {
          showMessage('Colonne non trouvée', 'error');
      }
  }
}

// Modal pour ajouter un livre
function showAddBookModal() {
  appState.currentBookId = null;
  document.getElementById('bookModalTitle').textContent = 'Ajouter un livre';
  document.getElementById('bookForm').reset();
  
  // Remplir le select des colonnes
  const select = document.getElementById('bookColumn');
  select.innerHTML = appState.columns.map(column => 
      `<option value="${column.id}">${column.name}</option>`
  ).join('');
  
  showModal('bookModal');
}

// Édition d'un livre
function editBook(bookId) {
  const book = appState.books.find(b => b.id === bookId);
  if (!book) return;
  
  appState.currentBookId = bookId;
  document.getElementById('bookModalTitle').textContent = 'Modifier le livre';
  
  // Remplir le formulaire
  document.getElementById('bookTitle').value = book.title;
  document.getElementById('bookAuthor').value = book.author;
  document.getElementById('bookISBN').value = book.isbn || '';
  document.getElementById('bookRating').value = book.rating || '';
  document.getElementById('bookComment').value = book.comment || '';
  
  // Remplir le select des colonnes
  const select = document.getElementById('bookColumn');
  select.innerHTML = appState.columns.map(column => 
      `<option value="${column.id}" ${column.id === book.column ? 'selected' : ''}>${column.name}</option>`
  ).join('');
  
  closeModal('bookDetailsModal');
  showModal('bookModal');
}

// Suppression d'un livre
function deleteBook(bookId) {
  if (confirm('Êtes-vous sûr de vouloir supprimer ce livre ?')) {
      appState.books = appState.books.filter(b => b.id !== bookId);
      saveDataToStorage();
      renderColumns();
      closeModal('bookDetailsModal');
      showMessage('Livre supprimé avec succès', 'success');
  }
}

// Gestion de la soumission du formulaire
function handleBookSubmit(event) {
  event.preventDefault();
  
  const bookData = {
      title: document.getElementById('bookTitle').value,
      author: document.getElementById('bookAuthor').value,
      isbn: document.getElementById('bookISBN').value,
      column: document.getElementById('bookColumn').value,
      rating: parseFloat(document.getElementById('bookRating').value) || 0,
      comment: document.getElementById('bookComment').value
  };
  
  if (appState.currentBookId) {
      // Modification
      const bookIndex = appState.books.findIndex(b => b.id === appState.currentBookId);
      if (bookIndex !== -1) {
          appState.books[bookIndex] = { ...appState.books[bookIndex], ...bookData };
          showMessage('Livre modifié avec succès', 'success');
      }
  } else {
      // Ajout
      const newBook = {
          id: generateId(),
          ...bookData
      };
      appState.books.push(newBook);
      showMessage('Livre ajouté avec succès', 'success');
  }
  
  saveDataToStorage();
  renderColumns();
  closeModal('bookModal');
}

// Modal de personnalisation des colonnes
function showColumnSettingsModal() {
  const columnsList = document.getElementById('columnsList');
  columnsList.innerHTML = appState.columns.map(column => `
      <div class="form-group" style="display: flex; align-items: center; gap: 1rem;">
          <input type="text" class="form-input" value="${column.name}" 
                 onchange="updateColumnName('${column.id}', this.value)" style="flex: 1;">
          <input type="color" value="${column.color}" 
                 onchange="updateColumnColor('${column.id}', this.value)" style="width: 50px; height: 40px;">
          <button class="btn btn-secondary" onclick="deleteColumn('${column.id}')" 
                  ${appState.columns.length <= 1 ? 'disabled' : ''}>
              🗑️
          </button>
      </div>
  `).join('');
  
  showModal('columnSettingsModal');
}

// Mise à jour du nom d'une colonne
function updateColumnName(columnId, newName) {
  const column = appState.columns.find(c => c.id === columnId);
  if (column && newName.trim()) {
      column.name = newName.trim();
      saveDataToStorage();
      renderColumns();
  }
}

// Mise à jour de la couleur d'une colonne
function updateColumnColor(columnId, newColor) {
  const column = appState.columns.find(c => c.id === columnId);
  if (column) {
      column.color = newColor;
      saveDataToStorage();
      renderColumns();
  }
}

// Ajout d'une nouvelle colonne
function addNewColumn() {
  const name = prompt('Nom de la nouvelle colonne :');
  if (name && name.trim()) {
      const newColumn = {
          id: generateId(),
          name: name.trim(),
          color: '#' + Math.floor(Math.random()*16777215).toString(16)
      };
      appState.columns.push(newColumn);
      saveDataToStorage();
      renderColumns();
      showColumnSettingsModal();
      showMessage('Colonne ajoutée avec succès', 'success');
  }
}

// Suppression d'une colonne
function deleteColumn(columnId) {
  if (appState.columns.length <= 1) {
      showMessage('Vous devez conserver au moins une colonne', 'error');
      return;
  }
  
  const column = appState.columns.find(c => c.id === columnId);
  const booksInColumn = appState.books.filter(b => b.column === columnId);
  
  if (booksInColumn.length > 0) {
      if (!confirm(`Cette colonne contient ${booksInColumn.length} livre(s). Les déplacer vers la première colonne ?`)) {
          return;
      }
      
      // Déplacer les livres vers la première colonne restante
      const firstColumn = appState.columns.find(c => c.id !== columnId);
      booksInColumn.forEach(book => {
          book.column = firstColumn.id;
      });
  }
  
  appState.columns = appState.columns.filter(c => c.id !== columnId);
  saveDataToStorage();
  renderColumns();
  showColumnSettingsModal();
  showMessage('Colonne supprimée', 'success');
}

// Fonctions utilitaires pour les modals
function showModal(modalId) {
  document.getElementById(modalId).classList.add('show');
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('show');
}

// Gestion des messages
function showMessage(text, type) {
  const messageArea = document.getElementById('messageArea');
  const messageDiv = document.createElement('div');
  messageDiv.className = `message message-${type}`;
  messageDiv.textContent = text;
  
  messageArea.appendChild(messageDiv);
  
  // Suppression automatique après 3 secondes
  setTimeout(() => {
      messageDiv.style.animation = 'fadeOut 0.3s ease';
      setTimeout(() => messageDiv.remove(), 300);
  }, 3000);
}

// Affichage/masquage du loader
function showLoader() {
  document.getElementById('loader').classList.add('show');
}

function hideLoader() {
  document.getElementById('loader').classList.remove('show');
}

// Génération d'ID unique
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Configuration des événements
function setupEventListeners() {
  // Fermeture des modals en cliquant à l'extérieur
  document.querySelectorAll('.modal').forEach(modal => {
      modal.addEventListener('click', function(event) {
          if (event.target === modal) {
              modal.classList.remove('show');
          }
      });
  });

  // Gestion des raccourcis clavier
  document.addEventListener('keydown', function(event) {
      // Échap pour fermer les modals
      if (event.key === 'Escape') {
          document.querySelectorAll('.modal.show').forEach(modal => {
              modal.classList.remove('show');
          });
      }
      
      // Ctrl/Cmd + N pour ajouter un livre
      if ((event.ctrlKey || event.metaKey) && event.key === 'n') {
          event.preventDefault();
          showAddBookModal();
      }
  });

  // Recherche ISBN automatique
  document.getElementById('bookISBN').addEventListener('blur', async function() {
      const isbn = this.value.trim();
      if (isbn && isbn.length >= 10) {
          const bookData = await searchBookByISBN(isbn);
          if (bookData) {
              document.getElementById('bookTitle').value = bookData.title;
              document.getElementById('bookAuthor').value = bookData.author;
              showMessage('Informations du livre trouvées !', 'success');
          }
      }
  });
}

// Simulation d'appel API pour recherche ISBN
async function searchBookByISBN(isbn) {
  showLoader();
  try {
      // Simulation d'un appel à une API de livres
      const response = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`);
      
      if (!response.ok) {
          throw new Error('Erreur réseau');
      }
      
      const data = await response.json();
      const bookData = data[`ISBN:${isbn}`];
      
      if (bookData) {
          return {
              title: bookData.title || '',
              author: bookData.authors ? bookData.authors[0].name : '',
              isbn: isbn
          };
      }
      
      return null;
  } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      showMessage('Erreur lors de la recherche du livre', 'error');
      return null;
  } finally {
      hideLoader();
  }
}

// Fonctions bonus
function exportData() {
  const dataStr = JSON.stringify(appState, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = 'bibliotheque-export.json';
  link.click();
  
  URL.revokeObjectURL(url);
  showMessage('Données exportées avec succès', 'success');
}

function importData() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  
  input.onchange = async (event) => {
      const file = event.target.files[0];
      if (!file) return;
      
      try {
          const text = await file.text();
          const data = JSON.parse(text);
          
          if (data.books && data.columns) {
              appState = data;
              saveDataToStorage();
              renderColumns();
              showMessage('Données importées avec succès', 'success');
          } else {
              throw new Error('Format de fichier invalide');
          }
      } catch (error) {
          console.error('Erreur lors de l\'importation:', error);
          showMessage('Erreur lors de l\'importation du fichier', 'error');
      }
  };
  
  input.click();
}

// Statistiques de lecture
function getReadingStats() {
  const stats = {
      total: appState.books.length,
      read: appState.books.filter(b => b.column === 'read').length,
      reading: appState.books.filter(b => b.column === 'reading').length,
      toRead: appState.books.filter(b => b.column === 'to-read').length,
      avgRating: 0
  };
  
  const ratedBooks = appState.books.filter(b => b.rating > 0);
  if (ratedBooks.length > 0) {
      stats.avgRating = ratedBooks.reduce((sum, b) => sum + b.rating, 0) / ratedBooks.length;
  }
  
  return stats;
}

function showStats() {
  const stats = getReadingStats();
  const statsHTML = `
      <div class="stats-container">
          <h3>📊 Statistiques de lecture</h3>
          <div class="stat-item">
              <strong>Total de livres:</strong> ${stats.total}
          </div>
          <div class="stat-item">
              <strong>Livres lus:</strong> ${stats.read}
          </div>
          <div class="stat-item">
              <strong>En cours de lecture:</strong> ${stats.reading}
          </div>
          <div class="stat-item">
              <strong>À lire:</strong> ${stats.toRead}
          </div>
          <div class="stat-item">
              <strong>Note moyenne:</strong> ${stats.avgRating.toFixed(1)} ⭐
          </div>
      </div>
  `;
  
  // Créer un modal temporaire pour les stats
  const modal = document.createElement('div');
  modal.className = 'modal show';
  modal.innerHTML = `
      <div class="modal-content">
          <div class="modal-header">
              <h2 class="modal-title">Statistiques</h2>
              <span class="close-btn" onclick="this.closest('.modal').remove()">&times;</span>
          </div>
          ${statsHTML}
      </div>
  `;
  document.body.appendChild(modal);
  
  modal.addEventListener('click', function(e) {
      if (e.target === modal) {
          modal.remove();
      }
  });
}

// Recherche de livres
function searchBooks() {
  const searchTerm = prompt('Rechercher un livre (titre ou auteur):');
  if (!searchTerm) return;
  
  const results = appState.books.filter(book => 
      book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.author.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  if (results.length === 0) {
      showMessage('Aucun livre trouvé', 'info');
      return;
  }
  
  // Highlight les résultats
  document.querySelectorAll('.book-card').forEach(card => {
      const bookId = card.dataset.bookId;
      if (results.some(r => r.id === bookId)) {
          card.style.animation = 'pulse 2s ease-in-out';
          setTimeout(() => {
              card.style.animation = '';
          }, 2000);
      }
  });
  
  showMessage(`${results.length} livre(s) trouvé(s)`, 'success');
}

// Mode sombre
function toggleDarkMode() {
  document.body.classList.toggle('dark-mode');
  localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
}

// Ajout des boutons supplémentaires
function addExtraButtons() {
  const actionsDiv = document.querySelector('.actions');
  
  // Bouton de recherche
  const searchBtn = document.createElement('button');
  searchBtn.className = 'btn btn-primary';
  searchBtn.innerHTML = '🔍 Rechercher';
  searchBtn.onclick = searchBooks;
  actionsDiv.insertBefore(searchBtn, actionsDiv.firstChild);
  
  // Bouton de statistiques
  const statsBtn = document.createElement('button');
  statsBtn.className = 'btn btn-secondary';
  statsBtn.innerHTML = '📊 Statistiques';
  statsBtn.onclick = showStats;
  actionsDiv.appendChild(statsBtn);
  
  // Bouton d'export
  const exportBtn = document.createElement('button');
  exportBtn.className = 'btn btn-secondary';
  exportBtn.innerHTML = '📥 Exporter';
  exportBtn.onclick = exportData;
  actionsDiv.appendChild(exportBtn);
  
  // Bouton d'import
  const importBtn = document.createElement('button');
  importBtn.className = 'btn btn-secondary';
  importBtn.innerHTML = '📤 Importer';
  importBtn.onclick = importData;
  actionsDiv.appendChild(importBtn);
  
  // Bouton mode sombre dans le header
  const header = document.querySelector('header');
  const darkModeBtn = document.createElement('button');
  darkModeBtn.className = 'btn btn-secondary';
  darkModeBtn.style.position = 'absolute';
  darkModeBtn.style.right = '1rem';
  darkModeBtn.style.top = '50%';
  darkModeBtn.style.transform = 'translateY(-50%)';
  darkModeBtn.innerHTML = '🌓';
  darkModeBtn.onclick = toggleDarkMode;
  header.style.position = 'relative';
  header.appendChild(darkModeBtn);
}

// Debounce pour optimiser les performances
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
      const later = () => {
          clearTimeout(timeout);
          func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
  };
}

// Application du debounce sur la sauvegarde
const debouncedSave = debounce(saveDataToStorage, 500);