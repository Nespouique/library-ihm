# 📚 Library Management System

A modern web application for library management built with React, Vite, and Tailwind CSS. This application allows you to manage a collection of books, authors, and shelves with an elegant and responsive user interface.

## 🌟 Features

### 📖 Book Management
- **Collection Display** : Responsive grid view of books
- **Advanced Search** : Search by title, author, or ISBN
- **Complete Details** : Detailed information for each book (title, author, ISBN, description, shelf, publication date)
- **Add New Books** : Intuitive interface to add books to the collection
- **Alphabetical Navigation** : Quick scrolling in alphabetical order

### 👥 Author Management
- **Author Directory** : Complete list of authors with their information
- **Detailed Profiles** : Biographies and lists of works by author
- **Add Authors** : Form to register new authors
- **Automatic Association** : Automatic linking between books and authors

### 📚 Shelf Management
- **Spatial Organization** : Management of physical book locations
- **Overview** : Preview of each shelf's contents
- **Create Shelves** : Interface to add new sections
- **Statistics** : Information about shelf occupancy

## 🚀 Technologies Used

### Frontend
- **React 18** - Modern JavaScript framework
- **Vite** - Ultra-fast build tool
- **React Router DOM** - Client-side navigation
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Smooth animations
- **Lucide React** - Modern icons

### UI Components
- **Radix UI** - Accessible and unstyled components
  - Dialog, Select, Toast, Tabs, etc.
- **Class Variance Authority** - Style variant management
- **Tailwind Merge** - Smart CSS class merging

### Development Tools
- **ESLint** - Code linting and formatting
- **PostCSS** - Advanced CSS processing
- **Autoprefixer** - Browser compatibility
- **Terser** - JavaScript minification

## 📁 Project Structure

```
library-ihm/
├── public/                     # Static files
├── src/
│   ├── components/            # Reusable components
│   │   ├── ui/               # Base UI components
│   │   ├── AddBookDialog.jsx
│   │   ├── AddAuthorDialog.jsx
│   │   ├── BookCard.jsx
│   │   ├── AuthorCard.jsx
│   │   ├── Layout.jsx
│   │   └── SearchBar.jsx
│   ├── pages/                # Main pages
│   │   ├── BooksPage.jsx
│   │   ├── AuthorsPage.jsx
│   │   └── ShelvesPage.jsx
│   ├── lib/                  # Utilities
│   │   └── utils.js
│   ├── App.jsx              # Main component
│   ├── main.jsx             # Entry point
│   └── index.css            # Global styles
├── plugins/                  # Custom Vite plugins
│   └── visual-editor/       # Integrated visual editor
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md
```

## 🛠️ Installation and Setup

### Prerequisites
- **Node.js** (version 16 or higher)
- **npm** or **yarn**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/library-ihm.git
   cd library-ihm
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Access the application**
   ```
   http://localhost:5173
   ```

### Available Scripts

```bash
# Development with hot reload
npm run dev

# Production build
npm run build

# Preview build
npm run preview
```

## 🎨 User Interface

### Design System
- **Color Palette** : Modern theme with dark mode support
- **Typography** : System font optimized for readability
- **Animations** : Smooth transitions with Framer Motion
- **Responsive** : Adaptive interface for all screen sizes

### Navigation
- **Main Menu** : Quick access to the three main sections
- **Global Search** : Search bar available on all pages
- **Floating Buttons** : Main actions easily accessible

## 📱 Responsive Design

The application is fully responsive and optimized for:
- **Desktop** : Complete interface with sidebar and extended grids
- **Tablet** : Adaptive layout with optimized navigation
- **Mobile** : Mobile-first interface with touch navigation

## 🔧 Customization

### Themes
The project uses a customizable CSS variable system in `src/index.css` to facilitate color and spacing customization.

### Components
All components are modular and can be easily extended or modified according to your needs.

## 🤝 Contributing

Contributions are welcome! To contribute:

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License. See the `LICENSE` file for more details.

## 📞 Support

For any questions or issues, feel free to:
- Open an issue on GitHub
- Contact the development team

---

**Developed with ❤️ and hosted by Hostinger Horizons**