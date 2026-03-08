# GitHub Repository Generator

![React](https://img.shields.io/badge/React-19.2.4-61dafb?style=flat&logo=react)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-f7df1e?style=flat&logo=javascript)
![Claude AI](https://img.shields.io/badge/Claude%20AI-Sonnet%204-orange?style=flat)
![License](https://img.shields.io/badge/License-MIT-blue?style=flat)
![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen?style=flat)

## Overview

The **GitHub Repository Generator** is an intelligent web application that automatically creates comprehensive README files and project documentation by analyzing your uploaded project files. Powered by Claude AI and built with React, it transforms your codebase into professional GitHub-ready documentation with detailed project overviews, folder structures, and tech stack analysis.

Simply drag and drop your project files, and watch as AI generates a complete README with installation instructions, feature descriptions, and proper documentation structure that follows GitHub best practices.

## ✨ Features

- **🤖 AI-Powered Analysis**: Leverages Claude Sonnet 4 to intelligently analyze project structure and generate comprehensive documentation
- **📁 Drag & Drop Interface**: Intuitive file upload system supporting multiple file formats
- **🎯 Smart Tech Stack Detection**: Automatically identifies and lists technologies used in your project
- **📊 Folder Structure Visualization**: Generates interactive tree view of your project architecture
- **📝 Professional README Generation**: Creates GitHub-ready documentation with proper sections and formatting
- **🎨 Modern UI**: Clean, responsive interface with smooth animations and visual feedback
- **⚡ Real-time Processing**: Fast analysis and generation with loading states and progress indicators
- **📋 One-Click Copy**: Easy copying of generated README content to clipboard
- **🔒 Secure API Integration**: Safe handling of API keys with client-side processing

## 🛠 Tech Stack

- **Frontend**: React 19.2.4, JavaScript ES6+, CSS3
- **AI Integration**: Claude AI API (Sonnet 4)
- **Build Tools**: Create React App, React Scripts
- **Testing**: Jest, React Testing Library
- **Deployment**: GitHub Pages, Vercel
- **Development**: ESLint, Web Vitals

## 📁 Folder Structure


github-repo-generator/
├── api/
│   └── generate.js              # Serverless function for Claude AI API
├── public/
│   ├── index.html              # HTML template
│   ├── manifest.json           # PWA manifest
│   └── robots.txt              # SEO configuration
├── src/
│   ├── App.jsx                 # Main React component
│   ├── App.css                 # Component styles
│   ├── index.js                # Application entry point
│   ├── index.css               # Global styles
│   ├── App.test.js             # Component tests
│   ├── setupTests.js           # Test configuration
│   └── reportWebVitals.js      # Performance monitoring
├── package.json                # Dependencies and scripts
├── .gitignore                  # Git ignore rules
└── README.md                   # Project documentation


## 🚀 Installation & Usage

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn package manager
- Claude AI API key

### Installation

1. **Clone the repository**
   bash
   git clone https://github.com/plat0cracy/Github-Repository-Generator.git
   cd Github-Repository-Generator
   

2. **Install dependencies**
   bash
   npm install
   

3. **Start the development server**
   bash
   npm start
   

4. **Open your browser**
   Navigate to `http://localhost:3000` to view the application

### Usage

1. **Upload Project Files**: Drag and drop your project files or click "Browse Files" to select them
2. **Enter API Key**: Provide your Claude AI API key in the designated field
3. **Generate Documentation**: Click the "Generate README" button to analyze your project
4. **Review Results**: View the generated README, tech stack, and folder structure
5. **Copy & Use**: Copy the generated content to your GitHub repository

### Supported File Types

- JavaScript (.js, .jsx, .ts, .tsx)
- Python (.py)
- Java (.java)
- Go (.go)
- Rust (.rs)
- C++ (.cpp, .cc)
- HTML (.html)
- CSS (.css)
- JSON (.json)
- Markdown (.md)
- YAML (.yaml, .yml)
- TOML (.toml)
- Text files (.txt)

### Building for Production

bash
npm run build


### Deployment

**GitHub Pages:**
bash
npm run deploy


**Vercel:**
Connect your GitHub repository to Vercel for automatic deployments.

## 🧪 Testing

Run the test suite:

bash
npm test


Run tests with coverage:

bash
npm test -- --coverage


## 🤝 Contributing

We welcome contributions to the GitHub Repository Generator! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Make your changes** and add tests if applicable
4. **Commit your changes** (`git commit -m 'Add amazing feature'`)
5. **Push to the branch** (`git push origin feature/amazing-feature`)
6. **Open a Pull Request**

### Development Guidelines

- Follow existing code style and conventions
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting
- Use meaningful commit messages

### Issues

Found a bug or have a feature request? Please [open an issue](https://github.com/plat0cracy/Github-Repository-Generator/issues) with:

- Clear description of the problem or feature
- Steps to reproduce (for bugs)
- Expected vs actual behavior
- Screenshots if applicable

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Anthropic](https://www.anthropic.com) for providing the Claude AI API
- [Create React App](https://create-react-app.dev) for the project foundation
- [React](https://reactjs.org) for the excellent frontend framework
- All contributors who help improve this project

---

<div align="center">
  <p>Made with ❤️ by <a href="https://github.com/plat0cracy">plat0cracy</a></p>
  <p>⭐ Star this repo if you find it helpful!</p>
</div>