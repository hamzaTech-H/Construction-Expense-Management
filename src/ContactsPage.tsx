import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader } from './ui/card';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import toast from 'react-hot-toast';
import { Input } from './components/base/input/input';
import { Button } from './components/base/buttons/button';
import { ButtonUtility } from './components/base/buttons/button-utility';
import { Edit, Plus, Trash2, X, Users, MessageCircle, Copy } from 'lucide-react';
import { Contact } from './types';
import { useTranslation } from 'react-i18next';

function toWhatsAppUrl(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  const withCountry = digits.startsWith('0') ? '213' + digits.slice(1) : digits;
  return `https://wa.me/${withCountry}`;
}

export default function ContactsPage() {
  const { t, i18n } = useTranslation();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [role, setRole] = useState('');

  const filteredContacts = useMemo(() => {
    const query = search.trim();
    if (!query) return contacts;
    const qLower = query.toLowerCase();
    const qDigits = query.replace(/\D/g, '');
    return contacts.filter((c) => {
      const nameMatch = c.name.toLowerCase().includes(qLower);
      const phoneMatch =
        qDigits.length > 0 &&
        c.phone_number &&
        c.phone_number.replace(/\D/g, '').includes(qDigits);
      const roleMatch = c.role != null && c.role.trim() !== '' && c.role.toLowerCase().includes(qLower);
      return nameMatch || phoneMatch || roleMatch;
    });
  }, [contacts, search]);

  const loadContacts = async () => {
    const list = await window.database.getAllContacts();
    setContacts(list);
  };

  useEffect(() => {
    loadContacts();
  }, []);

  const openAdd = () => {
    setEditingContact(null);
    setName('');
    setPhoneNumber('');
    setRole('');
    setDialogOpen(true);
  };

  const openEdit = (c: Contact) => {
    setEditingContact(c);
    setName(c.name);
    setPhoneNumber(c.phone_number);
    setRole(c.role ?? '');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const trimmedName = name.trim();
    const trimmedPhone = phoneNumber.trim();
    if (!trimmedName || !trimmedPhone) {
      toast.error(t('Name and phone number are required.'));
      return;
    }
    if (editingContact) {
      await window.database.updateContact(editingContact.id, trimmedName, trimmedPhone, role.trim() || null);
      setContacts((prev) =>
        prev.map((c) =>
          c.id === editingContact.id ? { ...c, name: trimmedName, phone_number: trimmedPhone, role: role.trim() || null } : c
        )
      );
      toast.success(t('Contact updated.'));
    } else {
      const id = await window.database.addContact(trimmedName, trimmedPhone, role.trim() || null);
      setContacts((prev) => [...prev, { id: id as number, name: trimmedName, phone_number: trimmedPhone, role: role.trim() || null }]);
      toast.success(t('Contact added.'));
    }
    setDialogOpen(false);
  };

  const openDelete = (c: Contact) => {
    setContactToDelete(c);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!contactToDelete) return;
    await window.database.deleteContact(contactToDelete.id);
    setContacts((prev) => prev.filter((c) => c.id !== contactToDelete.id));
    toast.success(t('Contact deleted.'));
    setDeleteDialogOpen(false);
    setContactToDelete(null);
  };

  const openWhatsApp = (c: Contact) => {
    window.open(toWhatsAppUrl(c.phone_number), '_blank');
  };

  const copyPhone = async (c: Contact) => {
    try {
      await navigator.clipboard.writeText(c.phone_number);
      toast.success(t('Phone number copied.'));
    } catch {
      toast.error(t('Failed to copy.'));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{t('Contacts')}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('Manage worker contacts and reach them quickly')}</p>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
              <Input
                label=""
                name="search"
                placeholder={t('Search by name, phone or role...')}
                value={search}
                onChange={(v) => setSearch(v)}
                className="max-w-xs"
              />
              <Button onClick={openAdd} className="shrink-0" iconLeading={<Plus data-icon />}>
                {t('Add Contact')}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {filteredContacts.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                {contacts.length === 0 ? t('No contacts yet. Add your first worker contact.') : t('No contacts match your search.')}
              </p>
            ) : (
              <ul className="space-y-2">
                {filteredContacts.map((c) => (
                  <li
                    key={c.id}
                    className="flex flex-wrap items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{c.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">{c.phone_number}</p>
                      {c.role && (
                        <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200">
                          {c.role}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <ButtonUtility
                        size="sm"
                        color="tertiary"
                        tooltip={t('WhatsApp')}
                        icon={MessageCircle}
                        onClick={() => openWhatsApp(c)}
                      />
                      <ButtonUtility
                        size="sm"
                        color="tertiary"
                        tooltip={t('Copy number')}
                        icon={Copy}
                        onClick={() => copyPhone(c)}
                      />
                      <ButtonUtility
                        size="sm"
                        color="tertiary"
                        tooltip={t('Edit')}
                        icon={Edit}
                        onClick={() => openEdit(c)}
                      />
                      <ButtonUtility
                        size="sm"
                        color="tertiary"
                        tooltip={t('Delete')}
                        icon={Trash2}
                        onClick={() => openDelete(c)}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Contact Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent dir={i18n.dir()} className={i18n.language === 'ar' ? 'font-arabic' : ''} hideClose>
          <div className="flex items-center justify-between mb-4">
            <DialogHeader className={i18n.language === 'ar' ? 'text-start' : 'text-left flex-1 min-w-0'}>
              <DialogTitle className="text-lg font-semibold">
                {editingContact ? t('Edit Contact') : t('Add Contact')}
              </DialogTitle>
            </DialogHeader>
            <DialogClose className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors shrink-0" aria-label={t('Close')}>
              <X className="w-5 h-5" />
            </DialogClose>
          </div>
          <DialogDescription className={i18n.language === 'ar' ? 'text-start' : 'text-left mb-4'}>
            {t('Enter contact details. Role is optional (e.g. maçon, plombier).')}
          </DialogDescription>
          <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
            <div className="space-y-4 py-4">
              <Input
                isRequired
                label={t('Name')}
                name="contactName"
                placeholder={t('Full name')}
                value={name}
                onChange={setName}
              />
              <Input
                isRequired
                label={t('Phone number')}
                name="contactPhone"
                placeholder=""
                value={phoneNumber}
                onChange={setPhoneNumber}
              />
              <Input
                label={`${t('Role')} (${t('optional')})`}
                name="contactRole"
                placeholder={t('e.g. maçon, plombier')}
                value={role}
                onChange={setRole}
              />
            </div>
            <DialogFooter className={i18n.language === 'ar' ? 'sm:flex-row-reverse sm:justify-start' : ''}>
              <Button type="button" color="secondary" onClick={() => setDialogOpen(false)}>
                {t('Cancel')}
              </Button>
              <Button type="submit">{editingContact ? t('Update') : t('Add')}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader dir={i18n.dir()}>
            <AlertDialogTitle>{t('Delete contact?')}</AlertDialogTitle>
            <AlertDialogDescription>
              {contactToDelete && t('This will remove "{{name}}" from your contacts. This action cannot be undone.', { name: contactToDelete.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button color="secondary" size="sm">{t('Cancel')}</Button>
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} asChild>
              <Button color="primary-destructive" size="sm">{t('Delete')}</Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
