import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import  toast from "react-hot-toast";
import { Input } from './components/base/input/input';
import { Button } from './components/base/buttons/button';
import { Toaster } from 'react-hot-toast';
import { Select } from './components/base/select/select';
import { Separator } from 'react-aria-components';
import { Edit01, Plus, Settings01, Trash01 } from '@untitledui/icons';
import { ButtonUtility } from './components/base/buttons/button-utility';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { DzFlagIcon, FrFlagIcon } from './FlagsSVG';
import { Settings } from './types';
import { useTranslation } from 'react-i18next';

interface ExpenseCategory {
  id: string;
  fr_name: string;
  ar_name: string;
}

export default function SettingsPage() {
  const { t, i18n } = useTranslation();

  const [settings, setSettings] = useState<Settings>({
    id: 1,
    language: '',
    company_name: '',
    owner_first_name: '',
    owner_last_name: '',
    address: '',
    email: '',
    phone_number: '',
  });

  const items = useMemo(() => [
    { label: "Français", id: "fr", icon: FrFlagIcon },
    { label: "العربية", id: "ar", icon: DzFlagIcon },
  ], []);

  // Expense Categories State
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);

  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  
  const [categoryFrench, setCategoryFrench] = useState('');
  const [categoryArabic, setCategoryArabic] = useState('');

  const handleSaveSettings = () => {
    toast.success(t('Settings saved successfully'));
    window.database.updateSettings(settings.id, settings.language, settings.company_name, settings.owner_first_name, settings.owner_last_name, settings.address, settings.email, settings.phone_number)
    i18n.changeLanguage(settings.language);
  };

  const handleAddCategory = () => {
    setEditingCategory(null);
    setCategoryFrench('');
    setCategoryArabic('');
    setCategoryDialogOpen(true);
  };

  const handleEditCategory = (category: ExpenseCategory) => {
    setEditingCategory(category);
    setCategoryFrench(category.fr_name);
    setCategoryArabic(category.ar_name);
    setCategoryDialogOpen(true);
  };

  const handleSaveCategory = () => {
    if (editingCategory) {
      // Update existing category
      setCategories(categories.map(cat => 
        cat.id === editingCategory.id 
          ? { ...cat, fr_name: categoryFrench, ar_name: categoryArabic }
          : cat
      ));
      toast.success(t('Category updated successfully'));
    } else {
      // Add new category
      const newCategory: ExpenseCategory = {
        id: Date.now().toString(),
        fr_name: categoryFrench,
        ar_name: categoryArabic,
      };
      setCategories([...categories, newCategory]);
      toast.success(t('Category added successfully'));
      window.database.addEXpenseCategory(categoryFrench, categoryArabic);
    }

    setCategoryDialogOpen(false);
    setCategoryFrench('');
    setCategoryArabic('');
    setEditingCategory(null);
  };

  const handleDeleteClick = (categoryId: string) => {
    setCategoryToDelete(categoryId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (categoryToDelete) {
      setCategories(categories.filter(cat => cat.id !== categoryToDelete));
      window.database.deleteExpenseCategory(Number(categoryToDelete));
      toast.success(t('Category deleted successfully'));
    }
    setDeleteDialogOpen(false);
    setCategoryToDelete(null);
  };

  useEffect(() => {
    const load = async () => {
      const categories = await window.database.getAllExpenseCategories();
      setCategories(categories);
      const settingsData  = await window.database.getSettings();
      setSettings(settingsData[0]); 
      i18n.changeLanguage(settingsData[0].language);
    };

    load();
  }, []);


  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Settings01 className="w-8 h-8 text-blue-600" />
          <h1>{t("Settings")}</h1>
        </div>

        {/* Company Information Section */}
        <form onSubmit={(e) => { 
          e.preventDefault(); 
          handleSaveSettings(); 
        }}>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>{t("Company Information")}</CardTitle>
              <CardDescription>{t("Configure your company details and preferences")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Language Selection */}
              <div className="space-y-2">
                  <Select
                      label={t("language")}
                      hint={t("Select default Language.")}
                      selectedKey={settings.language}
                      defaultSelectedKey={settings.language}
                      items={items}
                      onSelectionChange={(key) => setSettings({ ...settings, language: String(key) })}
                  >
                      {(item) => (
                          <Select.Item key={item.id} id={item.id} icon={item.icon}>
                              {item.label}
                          </Select.Item>
                      )}
                  </Select>
              </div>

              <Separator />

              {/* Company Name */}
              <div className="space-y-2">
                <Input
                  label={t('Company Name / Office')}
                  name="companyName"
                  placeholder={t("Enter company name")}
                  value={settings.company_name ?? ''}
                  onChange={(value) => setSettings({ ...settings, company_name: value })}
                />
              </div>

              {/* Owner Name and Surname */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Input
                    label={t('Owner Name')}
                    name="ownerName"
                    placeholder={t("Enter first name")}
                    value={settings.owner_first_name ?? ''}
                    onChange={(value) => setSettings({ ...settings, owner_first_name: value })}
                  />
                </div>
                <div className="space-y-2">
                  <Input
                    label={t('Owner Surname')}
                    name="ownerSurname"
                    placeholder={t("Enter surname")}
                    value={settings.owner_last_name ?? ''}
                    onChange={(value) => setSettings({ ...settings, owner_last_name: value })}
                  />
                </div>
              </div>

              {/* Address */}
              <div className="space-y-2">
                <Input
                  label={t('Address')}
                  name="address"
                  placeholder={t("Enter business address")}
                  value={settings.address ?? ''}
                  onChange={(value) => setSettings({ ...settings, address: value })}
                />
              </div>

              {/* Email and Phone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Input
                    label={t('Email')}
                    name="email"
                    type="email"
                    placeholder="email@example.com"
                    value={settings.email ?? ''}
                    onChange={(value) => setSettings({ ...settings, email: value })}
                  />
                </div>
                <div className="space-y-2">
                  <Input
                  label={t('Phone Number')}
                    name="phone"
                    type="tel"
                    value={settings.phone_number ?? ''}
                    onChange={(value) => setSettings({ ...settings, phone_number: value })}
                  />
                </div>
              </div>

              <Button type='submit' className="w-full md:w-auto">
                {t("Save Company Information")}
              </Button>
            </CardContent>
          </Card>

        </form>
       

        {/* Expense Categories Section */}
        
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t("Expense Categories")}</CardTitle>
                <CardDescription>{t("Manage expense categories in both French and Arabic")}</CardDescription>
              </div>
              <Button iconLeading={<Plus data-icon />} onClick={handleAddCategory}>
                {t("Add Category")}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    {i18n.language === 'ar' ? (
                      <>
                        <TableHead>{t("Actions")}</TableHead>
                        <TableHead className="text-right">{t("Arabic Name")}</TableHead>
                        <TableHead className="text-right">{t("French Name")}</TableHead>
                      </>
                    ) : (
                      <>
                        <TableHead>{t("French Name")}</TableHead>
                        <TableHead>{t("Arabic Name")}</TableHead>
                        <TableHead className="text-right">{t("Actions")}</TableHead>
                      </>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-gray-500 py-8">
                        {t('No categories added yet. Click "Add Category" to create one.')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    categories.map((category) => (
                      <TableRow key={category.id}>
                        {i18n.language === 'ar' ? (
                          <>
                            <TableCell>
                              <div className="flex gap-2">
                                <ButtonUtility size="sm" color="tertiary" tooltip={t("Delete")} icon={Trash01}  onClick={() => handleDeleteClick(category.id)}/>
                                <ButtonUtility size="sm" color="tertiary" tooltip={t("Edit")} icon={Edit01} onClick={() => handleEditCategory(category)}/>
                              </div>
                            </TableCell>
                            <TableCell className="font-arabic text-right">{category.ar_name}</TableCell>
                            <TableCell className="text-right">{category.fr_name}</TableCell>
                          </>
                        ) : (
                          <>
                            <TableCell>{category.fr_name}</TableCell>
                            <TableCell className="font-arabic">{category.ar_name}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <ButtonUtility size="sm" color="tertiary" tooltip={t("Delete")} icon={Trash01}  onClick={() => handleDeleteClick(category.id)}/>
                                <ButtonUtility size="sm" color="tertiary" tooltip={t("Edit")} icon={Edit01} onClick={() => handleEditCategory(category)}/>
                              </div>
                            </TableCell>
                          </>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Category Dialog */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? t('Edit Category') : t('Add New Category')}
            </DialogTitle>
            <DialogDescription>
              {t("Enter the category name in both French and Arabic")}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveCategory}>
            <div className="space-y-4 py-4">
              <Input 
                isRequired
                label={t("French Name")}
                name="categoryFrench"
                placeholder={t("e.g., Office Supplies")}
                value={categoryFrench}
                onChange={(value) => setCategoryFrench(value)}
              />

              <Input
                isRequired
                label={t("Arabic Name")}
                name="categoryArabic"
                placeholder={t("e.g., مستلزمات المكتب")}
                value={categoryArabic}
                onChange={(value) => setCategoryArabic(value)}
                dir="rtl"
              />
            </div>

            <DialogFooter>
              <Button type="button" color="secondary" onClick={() => setCategoryDialogOpen(false)}>
                {t("Cancel")}
              </Button>
              <Button type="submit">
                {editingCategory ? t('Update') : t('Add')} {t("Category")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("Are you sure?")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("This action cannot be undone. This will permanently delete the expense category.")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)} asChild>
              <Button color="secondary" size="sm">{t("Cancel")}</Button>
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} asChild>
              <Button color="primary-destructive" size="sm">{t("Delete")} </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Toaster />
    </div>
  );
}
