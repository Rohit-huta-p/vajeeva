import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { RequireAuth } from './auth';
import { AdminLayout } from './components/AdminLayout';
import { RecipeListPage } from './pages/RecipeListPage';
import { RecipeEditorPage } from './pages/RecipeEditorPage';
import { DashboardPage } from './pages/DashboardPage';
import { SourcesPage } from './pages/SourcesPage';
import { SubRecipesPage } from './pages/SubRecipesPage';
import { UsersPage } from './pages/UsersPage';
import { UserDetailPage } from './pages/UserDetailPage';
import { HealthFlagsPage } from './pages/HealthFlagsPage';
import { DietRulesPage } from './pages/DietRulesPage';
import { TagsPage } from './pages/TagsPage';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<RequireAuth />}>
          <Route element={<AdminLayout />}>
            <Route path="/" element={<RecipeListPage />} />
            <Route path="/recipes/new" element={<RecipeEditorPage />} />
            <Route path="/recipes/:id/edit" element={<RecipeEditorPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/sources" element={<SourcesPage />} />
            <Route path="/subrecipes" element={<SubRecipesPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/users/:id" element={<UserDetailPage />} />
            <Route path="/health-flags" element={<HealthFlagsPage />} />
            <Route path="/diet-rules" element={<DietRulesPage />} />
            <Route path="/tags" element={<TagsPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
