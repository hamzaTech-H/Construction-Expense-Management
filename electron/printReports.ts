import { BrowserWindow, app } from 'electron';
import path from 'path';
import fs from 'fs';
import { getProjectById, getExpensesByProject, getProjectStats } from './database'; // adjust path
import { getExpenseById, getPaymentsByExpense } from './database'; // adjust path
import { Expense } from '@/types';

export async function printProjectReport(projectId: number) {
  const project: any = await getProjectById(projectId);
  const expenses: any = await getExpensesByProject(projectId);
  const stats: any = await getProjectStats(projectId);

  const hasExpenses = expenses && expenses.length > 0;

  const htmlContent = `
    <html>
      <head>
        <meta charset="UTF-8" />
        <style>
  
          body {
            font-family: 'Times New Roman', serif;
            padding: 20px;
            color: #333;
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
  
          .project-info {
            margin-top: 20px;
            margin-bottom: 25px;
            font-size: 14px;
            line-height: 1.6;
            color: #333;
            text-align: left;
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
            text-align: left;
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
       <div class="project-info">
          <p><strong>Nom du projet :</strong> ${project.name}</p>
          <p><strong>Date de création :</strong> ${project.date}</p>
          <p><strong>Description :</strong> ${project.description || '-'}</p>
        </div>
  
        <header>
          <h1>Rapport Financier du Projet</h1>
          <p class="report-date">Date du rapport : ${new Date().toLocaleDateString('fr-DZ')}</p>
        </header>
  
        <section class="expense-summary">
          <div><strong>Montant total :</strong> ${new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(stats.total)} DA </div>
          <div><strong>Montant payé :</strong> ${new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(stats.paid)} DA </div>
          <div><strong>Montant restant :</strong> ${new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(stats.remaining)} DA</div>
        </section>
  
        <!-- Main expenses table -->
        ${
        hasExpenses
          ? `
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Montant Total (DA)</th>
                <th>Montant Payé (DA)</th>
                <th>Reste à Payer (DA)</th>
              </tr>
            </thead>
            <tbody>
              ${expenses
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
              Aucun enregistrement de dépense trouvé pour ce projet.
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

  const formattedPayments = payments
    .map(
       (payment, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(payment.amount)}</td>
        <td>${new Date(payment.date).toLocaleDateString('fr-DZ')}</td>
        <td>${payment.note || '-'}</td>
      </tr>`
    )
    .join('');

  const htmlContent = `
  <html>
    <head>
      <meta charset="UTF-8" />
      <title>Rapport des paiements</title>
      <style>
        body {
          font-family: 'Times New Roman', serif;
          padding: 40px 50px;
          color: #333;
          line-height: 1.6;
          background: #fff;
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
          text-align: left;
        }

        @media print {
          body { padding: 20px; }
          footer { position: fixed; bottom: 10px; left: 0; right: 0; }
        }
      </style>
    </head>

    <body>
   
      <header style="text-align:center; margin-bottom:30px; font-family: 'Georgia', serif;">
        <h1>
          Rapport de paiements
        </h1>
        <div style="margin-top:10px; font-size:12px; color:#777;">
          Date du rapport : ${new Date().toLocaleDateString('fr-DZ')}
        </div>
      </header>

       <div class="project-info">
        <p><strong>Pour : </strong> ${expense.description || '-'}</p>
      </div>

      <section class="expense-summary">
        <div><strong>Montant total :</strong> ${new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(expense.amount_total)} DA</div>
        <div><strong>Montant payé :</strong> ${new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(expense.amount_paid)} DA</div>
        <div><strong>Montant restant :</strong> ${new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(expense.amount_remaining)} DA</div>
      </section>

      <h2 style="margin-top: 30px;">Détails des paiements</h2>
      ${
        payments.length
          ? `<table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Montant</th>
                  <th>Date</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>${formattedPayments}</tbody>
            </table>`
          : `<p>Aucun paiement enregistré pour cette dépense.</p>`
      }

    </body>
  </html>
  `;

  const pdfWindow = new BrowserWindow({ show: false });
  await pdfWindow.loadURL(`data:text/html;charset=UTF-8,${encodeURIComponent(htmlContent)}`);

  const pdfBuffer = await pdfWindow.webContents.printToPDF({ printBackground: true, pageSize: 'A4' });
  const pdfPath = path.join(app.getPath('desktop'), `Paiements_${expenseId}.pdf`);
  fs.writeFileSync(pdfPath, pdfBuffer);

  const previewWin = new BrowserWindow({ width: 900, height: 800, title: 'Aperçu du rapport des paiements' });
  previewWin.loadURL(`file://${pdfPath}`);
}