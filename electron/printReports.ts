import { BrowserWindow, app } from 'electron';
import path from 'path';
import fs from 'fs';
import { getProjectById, getExpensesByProject, getSettings } from './database'; // adjust path
import { getExpenseById, getPaymentsByExpense } from './database'; // adjust path
import { Expense } from '@/types';

// Translation object
const translations: Record<string, Record<string, string>> = {
  fr: {
    companyName: 'Nom de l\'entreprise',
    owner: 'Propriétaire',
    address: 'Adresse',
    email: 'Email',
    phone: 'Téléphone',
    projectName: 'Nom du projet',
    financialReport: 'Rapport Financier du Projet',
    reportDate: 'Date du rapport',
    totalAmount: 'Montant total',
    amountPaid: 'Montant payé',
    remainingAmount: 'Montant restant',
    description: 'Description',
    totalAmountDA: 'Montant Total (DA)',
    amountPaidDA: 'Montant Payé (DA)',
    remainingToPayDA: 'Reste à Payer (DA)',
    noExpensesFound: 'Aucun enregistrement de dépense trouvé pour ce projet.',
    paymentsReport: 'Rapport de paiements',
    for: 'Pour',
    paymentDetails: 'Détails des paiements',
    amount: 'Montant',
    date: 'Date',
    note: 'Note',
    noPaymentsFound: 'Aucun paiement enregistré pour cette dépense.',
  },
  ar: {
    companyName: 'اسم الشركة',
    owner: 'المالك',
    address: 'العنوان',
    email: 'البريد الإلكتروني',
    phone: 'رقم الهاتف',
    projectName: 'اسم المشروع',
    financialReport: 'التقرير المالي للمشروع',
    reportDate: 'تاريخ التقرير',
    totalAmount: 'المبلغ الإجمالي',
    amountPaid: 'المبلغ المدفوع',
    remainingAmount: 'المبلغ المتبقي',
    description: 'الوصف',
    totalAmountDA: 'المبلغ الإجمالي (دج)',
    amountPaidDA: 'المبلغ المدفوع (دج)',
    remainingToPayDA: 'المتبقي للدفع (دج)',
    noExpensesFound: 'لم يتم العثور على سجلات مصروفات لهذا المشروع.',
    paymentsReport: 'تقرير المدفوعات',
    for: 'ل',
    paymentDetails: 'تفاصيل المدفوعات',
    amount: 'المبلغ',
    date: 'التاريخ',
    note: 'ملاحظة',
    noPaymentsFound: 'لم يتم تسجيل أي مدفوعات لهذا المصروف.',
  },
};

export async function printProjectReport(projectId: number, categoryId?: string | number | null, tabLabel?: string | null) {
  const project: any = await getProjectById(projectId);
  const expenses: any = await getExpensesByProject(projectId);
  const settingsArray: any = getSettings();
  const settings = settingsArray && settingsArray.length > 0 ? settingsArray[0] : null;

  // Get language from settings or default to 'fr'
  const language = settings?.language === 'ar' ? 'ar' : 'fr';
  const t = translations[language];

  const filteredExpenses = categoryId == null || String(categoryId) === 'all'
    ? expenses
    : (expenses || []).filter((e: any) => String(e.category_id) === String(categoryId));

  const stats = (filteredExpenses || []).reduce(
    (acc: any, e: any) => ({
      total: acc.total + Number(e.amount_total ?? 0),
      paid: acc.paid + Number(e.amount_paid ?? 0),
      remaining: acc.remaining + Number(e.amount_remaining ?? 0),
    }),
    { total: 0, paid: 0, remaining: 0 },
  );

  const hasExpenses = filteredExpenses && filteredExpenses.length > 0;
  
  // Prepare owner name
  const ownerFirstName = settings?.owner_first_name || '';
  const ownerLastName = settings?.owner_last_name || '';
  const ownerName = [ownerFirstName, ownerLastName].filter(Boolean).join(' ') || '-';

  // RTL support for Arabic
  const htmlDir = language === 'ar' ? 'rtl' : 'ltr';
  const textAlign = language === 'ar' ? 'right' : 'left';
  const currencySymbol = language === 'ar' ? 'دج' : 'DA';

  const htmlContent = `
    <html dir="${htmlDir}">
      <head>
        <meta charset="UTF-8" />
        <style>
  
          body {
            font-family: ${language === 'ar' ? "'Arial', 'Tahoma', sans-serif" : "'Times New Roman', serif"};
            padding: 20px;
            color: #333;
            direction: ${htmlDir};
          }
  
          header {
            text-align: center;
            margin-bottom: 25px;
          }
  
          h1 {
            font-family: 'Georgia', 'Times New Roman', Times, serif;
            font-size: 28px; 
            font-weight: 500; /* Medium weight, less heavy than 700 */
            text-transform: capitalize; /* Capitalize the main words */
            color: #444; /* Dark gray for a softer contrast */
            text-align: center;
            letter-spacing: 0.5px;
            margin-bottom: 14px;
          }
  
          h1 + .report-date {
            border-bottom: 2px solid #ddd; /* Light gray line */
            padding-bottom: 20px;
            margin-bottom: 20px;
            display: block; /* Ensures the border spans the full width */
          }
            
          h2 {
            font-size: 16px;
            font-weight: 500;
            color: #444;
            margin-bottom: 6px;
          }
  
          .report-date {
            font-size: 12px;
            color: #777;
            margin: 0;
          }
  
          .expense-summary {
            margin-top: 20px;
            border: 1px solid #ccc;
            border-radius: 10px;
            padding: 20px;
            background: #fafafa;
          }
  
          .expense-summary div {
            margin: 5px 0;
          }
  
          .company-info {
            margin-bottom: 20px;
            font-size: 13px;
            line-height: 1.8;
            color: #333;
            text-align: ${textAlign};
          }

          .company-info p {
            margin: 3px 0;
          }

          .company-info strong {
            color: #444;
            font-weight: 600;
          }

          .separator {
            border-bottom: 2px solid #ddd;
            margin-bottom: 25px;
            padding-bottom: 15px;
          }

          .project-info {
            margin-top: 20px;
            margin-bottom: 25px;
            font-size: 14px;
            line-height: 1.6;
            color: #333;
            text-align: ${textAlign};
          }

          .project-info p {
            margin: 4px 0;
          }

          .project-info strong {
            color: #444;
          }
  
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
  
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
          }
  
          /* Improved header style */
          th {
            background-color: #f2f2f2;
            text-align: center;
            font-size: 13px;
            font-weight: 600;
            letter-spacing: 0.4px;
            color: #444;
          }
  
          td {
            font-size: 13px;
            text-align: ${textAlign};
          }
  
          .stats-section {
            page-break-inside: avoid; /* prevent breaking inside the block */
            break-inside: avoid; /* modern equivalent */
          }
  
          /* Stats summary table (right aligned) */
          .stats-title {
            text-align: right;
            font-weight: 600;
            font-size: 15px;
            margin-top: 30px;
            margin-bottom: 8px;
            color: #444;
          }
  
        </style>
      </head>
      <body>
        <div class="company-info separator">
          <p><strong>${t.companyName} :</strong> ${settings?.company_name || '-'}</p>
          <p><strong>${t.owner} :</strong> ${ownerName}</p>
          <p><strong>${t.address} :</strong> ${settings?.address || '-'}</p>
          <p><strong>${t.email} :</strong> ${settings?.email || '-'}</p>
          <p><strong>${t.phone} :</strong> ${settings?.phone_number || '-'}</p>
        </div>

        <header>
          <h1>${t.financialReport}${tabLabel ? ` – ${tabLabel}` : ''}</h1>
          <p class="report-date">${t.reportDate} : ${new Date().toLocaleDateString(language === 'ar' ? 'ar-DZ' : 'fr-DZ')}</p>
          <p style="margin-top: 10px; font-size: 14px; color: #555; text-align: ${textAlign};"><strong>${t.projectName} :</strong> ${project.name}</p>
          <p style="margin-top: 6px; font-size: 14px; color: #555; text-align: ${textAlign};"><strong>${t.description} :</strong> ${project.description || '-'}</p>
        </header>

        <section class="expense-summary">
          <div><strong>${t.totalAmount} :</strong> ${new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(stats.total)} ${currencySymbol} </div>
          <div><strong>${t.amountPaid} :</strong> ${new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(stats.paid)} ${currencySymbol} </div>
          <div><strong>${t.remainingAmount} :</strong> ${new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(stats.remaining)} ${currencySymbol}</div>
        </section>
  
        <!-- Main expenses table -->
        ${
        hasExpenses
          ? `
          <table>
            <thead>
              <tr>
                <th>${t.description}</th>
                <th>${t.totalAmountDA}</th>
                <th>${t.amountPaidDA}</th>
                <th>${t.remainingToPayDA}</th>
              </tr>
            </thead>
            <tbody>
              ${filteredExpenses
                .map(
                  (expense: Expense) => `
                    <tr>
                      <td>${expense.description}</td>
                      <td style="text-align:center">${new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(expense.amount_total)}</td>
                      <td style="text-align:center">${new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(expense.amount_paid)}</td>
                      <td style="text-align:center">${new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(expense.amount_remaining)}</td>
                    </tr>
                  `
                )
                .join('')}
            </tbody>
          </table>  `
            : `
            <div style="text-align:center; margin-top:50px; color:#777; font-size:15px;">
              ${t.noExpensesFound}
            </div>
          `
        }
      </body>
    </html>
    `;

  const pdfWindow = new BrowserWindow({ show: false });
  await pdfWindow.loadURL(`data:text/html;charset=UTF-8,${encodeURIComponent(htmlContent)}`);

  const pdfBuffer = await pdfWindow.webContents.printToPDF({
    printBackground: true,
    pageSize: 'A4',
  });

  const pdfPath = path.join(app.getPath('desktop'), 'rapport.pdf');
  fs.writeFileSync(pdfPath, pdfBuffer);

  const previewWin = new BrowserWindow({ width: 900, height: 800, title: 'Rapport PDF Preview' });
  previewWin.loadURL(`file://${pdfPath}`);
}


export async function printExpensePayments(expenseId: number) {
  const expense: any = await getExpenseById(expenseId);
  const payments = await getPaymentsByExpense(expenseId);
  const settingsArray: any = getSettings();
  const settings = settingsArray && settingsArray.length > 0 ? settingsArray[0] : null;

  // Get language from settings or default to 'fr'
  const language = settings?.language === 'ar' ? 'ar' : 'fr';
  const t = translations[language];

  // RTL support for Arabic
  const htmlDir = language === 'ar' ? 'rtl' : 'ltr';
  const textAlign = language === 'ar' ? 'right' : 'left';
  const currencySymbol = language === 'ar' ? 'دج' : 'DA';

  const formattedPayments = payments
    .map(
       (payment, i) => `
      <tr>
        <td>${i + 1}</td>
        <td style="text-align:center">${new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(payment.amount)} ${currencySymbol}</td>
        <td style="text-align:center">${new Date(payment.date).toLocaleDateString(language === 'ar' ? 'ar-DZ' : 'fr-DZ')}</td>
        <td>${payment.note || '-'}</td>
      </tr>`
    )
    .join('');

  const htmlContent = `
  <html dir="${htmlDir}">
    <head>
      <meta charset="UTF-8" />
      <title>${t.paymentsReport}</title>
      <style>
        body {
          font-family: ${language === 'ar' ? "'Arial', 'Tahoma', sans-serif" : "'Times New Roman', serif"};
          padding: 40px 50px;
          color: #333;
          line-height: 1.6;
          background: #fff;
          direction: ${htmlDir};
        }

        header {
          text-align: center;
          margin-bottom: 30px;
        }

        h1 {
          font-family: 'Georgia', 'Times New Roman', Times, serif;
          font-size: 28px; 
          font-weight: 500; /* Medium weight, less heavy than 700 */
          text-transform: capitalize; /* Capitalize the main words */
          color: #444; /* Dark gray for a softer contrast */
          text-align: center;
          letter-spacing: 0.5px;
          margin-bottom: 5px;
        }

        .expense-description {
          border-bottom: 1px solid #ccc;
          padding-bottom: 10px;
          margin-bottom: 20px;
        }

        .expense-summary {
          margin-top: 20px;
          border: 1px solid #ccc;
          border-radius: 10px;
          padding: 20px;
          background: #fafafa;
        }

        .expense-summary div {
          margin: 5px 0;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 30px;
        }

        th, td {
          border: 1px solid #ddd;
          padding: 8px;
        }

        /* Improved header style */
        th {
          background-color: #f2f2f2;
          text-align: center;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.4px;
          color: #444;
        }

        td {
          font-size: 13px;
          text-align: ${textAlign};
        }

        @media print {
          body { padding: 20px; }
          footer { position: fixed; bottom: 10px; left: 0; right: 0; }
        }
      </style>
    </head>

    <body>
   
      <header style="text-align:center; margin-bottom:30px; font-family: ${language === 'ar' ? "'Arial', 'Tahoma', sans-serif" : "'Georgia', serif"};">
        <h1>
          ${t.paymentsReport}
        </h1>
        <div style="margin-top:10px; font-size:12px; color:#777;">
          ${t.reportDate} : ${new Date().toLocaleDateString(language === 'ar' ? 'ar-DZ' : 'fr-DZ')}
        </div>
      </header>

       <div class="project-info" style="text-align:${textAlign};">
        <p><strong>${t.for} : </strong> ${expense.description || '-'}</p>
      </div>

      <section class="expense-summary">
        <div><strong>${t.totalAmount} :</strong> ${new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(expense.amount_total)} ${currencySymbol}</div>
        <div><strong>${t.amountPaid} :</strong> ${new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(expense.amount_paid)} ${currencySymbol}</div>
        <div><strong>${t.remainingAmount} :</strong> ${new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(expense.amount_remaining)} ${currencySymbol}</div>
      </section>

      <h2 style="margin-top: 30px; text-align:${textAlign};">${t.paymentDetails}</h2>
      ${
        payments.length
          ? `<table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>${t.amount}</th>
                  <th>${t.date}</th>
                  <th>${t.note}</th>
                </tr>
              </thead>
              <tbody>${formattedPayments}</tbody>
            </table>`
          : `<p style="text-align:${textAlign};">${t.noPaymentsFound}</p>`
      }

    </body>
  </html>
  `;

  const pdfWindow = new BrowserWindow({ show: false });
  await pdfWindow.loadURL(`data:text/html;charset=UTF-8,${encodeURIComponent(htmlContent)}`);

  const pdfBuffer = await pdfWindow.webContents.printToPDF({ printBackground: true, pageSize: 'A4' });
  const pdfPath = path.join(app.getPath('desktop'), `${language === 'ar' ? 'مدفوعات' : 'Paiements'}_${expenseId}.pdf`);
  fs.writeFileSync(pdfPath, pdfBuffer);

  const previewWin = new BrowserWindow({ width: 900, height: 800, title: t.paymentsReport });
  previewWin.loadURL(`file://${pdfPath}`);
}