import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { RequireAuth } from './auth';
import { RecipeListPage } from './pages/RecipeListPage';
import { RecipeEditorPage } from './pages/RecipeEditorPage';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<RequireAuth />}>
          <Route path="/" element={<RecipeListPage />} />
          <Route path="/recipes/new" element={<RecipeEditorPage />} />
          <Route path="/recipes/:id/edit" element={<RecipeEditorPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
