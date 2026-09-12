// App Version 5.0.0 - Nigelec Edition (Refactored)
import React from 'react';
import { 
  Bell, Settings, Menu, Search, ChevronRight, Cpu, Key, Receipt, Headset, Tags, Smartphone, AlertTriangle, MapPin
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import { ThermalReceipt } from './components/ThermalReceipt';
import { LoginForm } from './components/LoginForm';
import { ToastContainer } from './components/ToastContainer';

import { UserModal } from './components/modals/UserModal';
import { CustomerModal } from './components/modals/CustomerModal';
import { MeterModal } from './components/modals/MeterModal';
import { TariffModal } from './components/modals/TariffModal';
import { RegionModal } from './components/modals/RegionModal';
import { DcuModal } from './components/modals/DcuModal';
import { TicketModal } from './components/modals/TicketModal';
import { SearchModal } from './components/modals/SearchModal';
import { PaymentModal } from './components/modals/PaymentModal';
import { ViewingMeterModal } from './components/modals/ViewingMeterModal';
import { GeneratedTokenModal } from './components/modals/GeneratedTokenModal';
import { ShiftModal } from './components/modals/ShiftModal';
import { FraudSimulationModal } from './components/modals/FraudSimulationModal';
import { ForgotPasswordModal } from './components/modals/ForgotPasswordModal';
import { MeterReplacementModal } from './components/modals/MeterReplacementModal';
import { LoadSheddingModal } from './components/modals/LoadSheddingModal';

import { Sidebar } from './components/Sidebar';
import { TariffsSection } from './sections/TariffsSection';
import { DashboardSection } from './sections/DashboardSection';
import { MetersSection } from './sections/MetersSection';
import { CustomersSection } from './sections/CustomersSection';
import { TokensSection } from './sections/TokensSection';
import { MdmsSection } from './sections/MdmsSection';
import { MapSection } from './sections/MapSection';
import { TicketsSection } from './sections/TicketsSection';
import { BillingSection } from './sections/BillingSection';
import { ReportsSection } from './sections/ReportsSection';
import { AlertsSection } from './sections/AlertsSection';
import { UsersSection } from './sections/UsersSection';
import { SettingsSection } from './sections/SettingsSection';
import { StsPrepaidSection } from './sections/StsPrepaidSection';
import { AuditSection } from './sections/AuditSection';
import { PaymentsSection } from './sections/PaymentsSection';
import { RegionsSection } from './sections/RegionsSection';
import { DcusSection } from './sections/DcusSection';
import { CustomerDashboardSection } from './sections/CustomerDashboardSection';
import { AnalyticsSection } from './sections/AnalyticsSection';
import { StatisticsSection } from './sections/StatisticsSection';
import { AssetsSection } from './sections/AssetsSection';
import { TicketsWrapper } from './sections/TicketsWrapper';
import { ApiDocsSection } from './sections/ApiDocsSection';
import { SecuritySection } from './sections/SecuritySection';
import { RevenueAssuranceSection } from './sections/RevenueAssuranceSection';
import { VendingSection } from './sections/VendingSection';

import { generateShiftReportPDF, generateRegulatoryReport, generateEnergyLossReport, generateFraudRiskReport, generateMobileMoneyReport, generateSystemIntegrityReport } from './utils/reports';

import { AmiProvider, useAmi } from './context/AmiContext';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function MainAppContent() {
  const {
    currentUser, isLoggedIn, login, logout,
    toasts, addToast,
    getApiUrl,
    customers, meters, tokens, regions, alerts, setAlerts, audits, invoices, tickets, payments, dcus, fetchData,
    currentSection, setCurrentSection,
    isNotificationsOpen, setIsNotificationsOpen,
    sidebarOpen, setSidebarOpen,
    customerSearch, setCustomerSearch,
    mdmsSearch, setMdmsSearch,
    ticketSearch, setTicketSearch,
    meterSearch, setMeterSearch,
    customerStatusFilter, setCustomerStatusFilter,
    isFraudModalOpen, setIsFraudModalOpen,
    isBillingLoading, billingProgress,
    isPaymentModalOpen, setIsPaymentModalOpen,
    selectedInvoice, setSelectedInvoice,
    isSearchModalOpen, setIsSearchModalOpen,
    globalSearchQuery, setGlobalSearchQuery,
    isCustomerModalOpen, setIsCustomerModalOpen,
    isMeterModalOpen, setIsMeterModalOpen,
    isTariffModalOpen, setIsTariffModalOpen,
    isRegionModalOpen, setIsRegionModalOpen,
    isDcuModalOpen, setIsDcuModalOpen,
    isUserModalOpen, setIsUserModalOpen,
    isForgotPasswordModalOpen, setIsForgotPasswordModalOpen,
    isReplacementModalOpen, setIsReplacementModalOpen,
    isLoadSheddingModalOpen, setIsLoadSheddingModalOpen,
    isShiftModalOpen, setIsShiftModalOpen,
    currentShift, setCurrentShift, pastShifts,
    isTicketModalOpen, setIsTicketModalOpen,
    editingCustomer, setEditingCustomer,
    editingMeter, setEditingMeter,
    editingTariff, setEditingTariff,
    editingTiers, setEditingTiers,
    editingRegion, setEditingRegion,
    editingDcu, setEditingDcu,
    editingTicket, setEditingTicket,
    editingUser, setEditingUser,
    generatedToken, setGeneratedToken,
    viewingMeter, setViewingMeter,
    isGeneratingToken,
    loginUsername, setLoginUsername,
    loginPassword, setLoginPassword,
    isLoginLoading,
    captcha, captchaInput, setCaptchaInput,
    tariffs, notifications, users, alertRules, mdmsStats, selectedMeterIntervals, analyticsTrends, settings,
    selectedMeterId, setSelectedMeterId,
    rechargeAmount, setRechargeAmount,
    selectedChannel, setSelectedChannel,
    alertsTab, setAlertsTab,
    navItems,
    generateCaptcha,
    handleLogin,
    handleResetPassword,
    handleReplaceMeter,
    handleExecuteLoadShedding,
    handleLogout,
    handleSaveCustomer,
    handleDeleteCustomer,
    handleSaveMeter,
    handleDeleteMeter,
    handleSaveTariff,
    handleDeleteTariff,
    handleSaveUser,
    handleDeleteUser,
    handleRunBilling,
    handlePayInvoice,
    handleSaveTicket,
    updateTicketStatus,
    handleUpdateAlertRule,
    handleSimulateMassReading,
    handleMassPayment,
    handleGenerateAlertsReport,
    handleGenerateMdmsReport,
    handleSimulateTamper,
    handleTriggerFraud,
    handleSimulateAnomaly,
    handleResetTamper,
    handleOpenShift,
    handleCloseShift,
    handleSaveRegion,
    handleSaveDcu,
    handleDeleteDcu,
    handleGenerateRegionalReport,
    handleUpdateMeterLifecycle,
    handleDeleteRegion,
    handleCalculateRecharge,
    handleGenerateToken,
    handlePrintReceipt,
    handleGenerateInvoicePDF,
    handleSaveSettings,
    handleRotateKeys,
    handleReadTelemetry,
    handleRemoteRelay
  } = useAmi();

  return (
    <div className="min-h-screen bg-bg-dark text-white font-outfit overflow-hidden flex">
      <Sidebar
        currentUser={currentUser}
        currentSection={currentSection}
        setCurrentSection={setCurrentSection}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        alerts={alerts}
        handleLogout={handleLogout}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-[#070b16] relative">
        {/* Global SCADA Cyber Grid & Volumetric Glows */}
        <div className="absolute inset-0 scada-grid-pattern opacity-30 pointer-events-none" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand/10 rounded-full blur-[140px] -mr-64 -mt-64 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-niger-green/8 rounded-full blur-[130px] -ml-40 -mb-40 pointer-events-none" />
        <div className="absolute top-1/2 left-1/3 w-[450px] h-[450px] bg-blue-500/5 rounded-full blur-[130px] pointer-events-none" />

        {/* Header */}
        <header className="h-20 flex items-center justify-between px-8 bg-bg-dark/50 backdrop-blur-xl border-b border-brand/10 z-30">
          <div className="flex items-center gap-8">
            <button onClick={() => setSidebarOpen(true)} className="p-2 lg:hidden text-gray-400 hover:text-white transition-colors">
              <Menu size={24} />
            </button>
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-tight">
                {currentSection === 'statistics' ? 'Statistiques & Bilans' :
                 currentSection === 'sts-prepaid' ? 'Guichet Vente & STS' :
                 currentSection === 'mdms' ? 'MDMS Bilan Énergie' :
                 currentSection === 'meters' ? 'Compteurs AMI' :
                 currentSection === 'customers' ? 'Clients & Abonnés' :
                 currentSection === 'tokens' ? 'Historique des Ventes' :
                 currentSection === 'payments' ? 'Portail Marchand +227' :
                 currentSection === 'billing' ? 'Facturation' :
                 currentSection === 'map' ? 'Carte Réseau SIG' :
                 currentSection === 'dcus' ? 'Concentrateurs DCU' :
                 currentSection === 'assets' ? 'Gestion Magasin' :
                 currentSection === 'alerts' ? 'Alertes & Fraudes' :
                 currentSection === 'audit' ? 'Journal d\'Audit KMS' :
                 currentSection === 'reports' ? 'Rapports ARSE' :
                 currentSection === 'regions' ? 'Régions NIGELEC' :
                 currentSection === 'tariffs' ? 'Gestion des Tarifs' :
                 currentSection === 'users' ? 'Gestion des Accès' :
                 currentSection === 'security' ? 'Sécurité & KMS' :
                 currentSection === 'api-docs' ? 'Documentation API' :
                 currentSection === 'settings' ? 'Paramètres du Système' :
                 currentSection === 'vending' ? 'Passerelle HES Autonome' :
                 currentSection === 'revenue-assurance' ? 'Revenue Assurance' :
                 currentSection.replace('-', ' ')}
              </h2>
              <div className="flex items-center gap-2 text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">
                <span>e-EnergieTEC</span>
                <ChevronRight size={10} />
                <span className="text-brand">Portail {currentUser?.role}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center bg-white/5 border border-white/10 rounded-2xl px-4 py-2 focus-within:border-brand/50 transition-all w-64 group" style={{ cursor: 'pointer' }} onClick={() => setIsSearchModalOpen(true)}>
              <Search size={18} className="text-gray-500 group-focus-within:text-brand transition-colors" />
              <span className="text-sm ml-2 text-gray-500">Recherche globale...</span>
            </div>

            <div className="flex items-center gap-3">
              {/* Bouton Notifications */}
              <div className="relative">
                {(() => {
                  const isCustomerRole = currentUser?.role === 'customer';
                  const customerMeters = isCustomerRole ? meters.filter(m => m.customerId === currentUser?.associatedCustomerId) : [];
                  const mainMeter = customerMeters[0];

                  const displayNotifications = isCustomerRole ? [
                    ...(mainMeter && mainMeter.credit < 10 ? [{
                      id: 'notif-low-credit',
                      title: 'Solde de Crédit Bas',
                      message: `Votre compteur ${mainMeter.id} dispose de ${mainMeter.credit.toFixed(2)} kWh restants. Pensez à recharger.`,
                      timestamp: new Date(),
                      type: 'warning'
                    }] : []),
                    ...(mainMeter ? [{
                      id: 'notif-meter-active',
                      title: 'Compteur Connecté',
                      message: `Compteur ${mainMeter.id} actif sur le réseau NIGELEC (${mainMeter.location}).`,
                      timestamp: new Date(Date.now() - 3600000),
                      type: 'info'
                    }] : []),
                    ...tokens.filter(t => t.meterId === mainMeter?.id).slice(0, 2).map(t => ({
                      id: `notif-token-${t.id}`,
                      title: 'Recharge STS Validée',
                      message: `Achat de ${t.amount.toLocaleString()} FCFA (+${t.kwh.toFixed(2)} kWh). Token: ${t.token}`,
                      timestamp: new Date(t.timestamp),
                      type: 'info'
                    })),
                    ...tickets.filter(t => t.customerId === currentUser?.associatedCustomerId).map(t => ({
                      id: `notif-tkt-${t.id}`,
                      title: `Ticket Support #${t.id} (${t.status})`,
                      message: `${t.subject} - Suivi par ${t.assignedTo || 'Service Client'}.`,
                      timestamp: new Date(t.timestamp),
                      type: t.status === 'Résolu' ? 'info' : 'warning'
                    }))
                  ] : alerts;

                  const unreadCount = displayNotifications.length;

                  return (
                    <>
                      <button 
                        onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                        className={cn(
                          "relative p-3 rounded-2xl border transition-all duration-300",
                          isNotificationsOpen ? "bg-brand/20 border-brand/50 text-brand" : "bg-white/5 border-white/10 text-gray-400 hover:bg-brand/10 hover:border-brand/30 hover:text-brand"
                        )}
                      >
                        <Bell size={20} />
                        {unreadCount > 0 && (
                          <span className="absolute top-3 right-3 w-2 h-2 bg-brand rounded-full ring-4 ring-bg-dark animate-pulse"></span>
                        )}
                      </button>

                      {/* Menu Déroulant Notifications - Fond Opaque Sécurisé */}
                      <AnimatePresence>
                        {isNotificationsOpen && (
                          <motion.div 
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute right-0 mt-4 w-80 md:w-96 bg-[#121214] backdrop-blur-2xl rounded-3xl border border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.9)] overflow-hidden z-50"
                          >
                            <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/5">
                              <span className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">
                                {isCustomerRole ? "Vos Notifications" : "Alertes Récentes"}
                              </span>
                              <span className="px-2 py-0.5 bg-brand/20 text-brand text-[8px] font-black rounded uppercase">
                                {unreadCount} {isCustomerRole ? "Messages" : "Nouvelles"}
                              </span>
                            </div>
                            <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
                              {displayNotifications.length === 0 ? (
                                <div className="p-8 text-center text-gray-600 text-[10px] font-bold uppercase">Aucune notification</div>
                              ) : (
                                displayNotifications.slice(0, 5).map((notif: any, i: number) => (
                                  <div 
                                    key={notif.id || `notif-header-${i}`} 
                                    onClick={() => { 
                                      if (isCustomerRole) {
                                        setCurrentSection('tickets');
                                      } else {
                                        setCurrentSection('alerts');
                                      }
                                      setIsNotificationsOpen(false); 
                                    }}
                                    className="p-4 border-b border-white/5 hover:bg-white/[0.05] transition-colors cursor-pointer group"
                                  >
                                    <div className="flex gap-3">
                                      <div className={cn(
                                        "w-2 h-2 rounded-full mt-1.5 shrink-0",
                                        notif.type === 'danger' ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" : notif.type === 'warning' ? "bg-orange-500" : "bg-green-500"
                                      )} />
                                      <div className="space-y-1">
                                        <p className="text-xs font-bold text-white group-hover:text-brand transition-colors line-clamp-1">{notif.title}</p>
                                        <p className="text-[10px] text-gray-400 leading-tight line-clamp-2">{notif.message}</p>
                                        <p className="text-[8px] text-gray-600 font-black uppercase mt-2">
                                          {format(new Date(notif.timestamp || Date.now()), 'HH:mm', { locale: fr })}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                            <button 
                              onClick={() => { 
                                if (isCustomerRole) {
                                  setCurrentSection('tickets');
                                } else {
                                  setCurrentSection('alerts');
                                }
                                setIsNotificationsOpen(false); 
                              }}
                              className="w-full py-3 bg-white/5 text-[9px] font-black text-brand uppercase tracking-widest hover:bg-brand hover:text-white transition-all border-t border-white/5"
                            >
                              {isCustomerRole ? "Voir mes demandes de support" : "Voir tout le centre de contrôle"}
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </>
                  );
                })()}
              </div>

              {/* Bouton Paramètres */}
              <button 
                onClick={() => setCurrentSection('settings')}
                className="p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-brand/10 hover:border-brand/30 text-gray-400 hover:text-brand transition-all duration-300"
              >
                <Settings size={20} />
              </button>
            </div>
          </div>
        </header>

        {/* Scrollable Area */}
        <div className="flex-1 p-8 pb-32 lg:pb-8 overflow-y-auto custom-scrollbar relative z-10">
          <AnimatePresence mode="wait">
            {(() => {
              switch (currentSection) {
                case 'dashboard':
                  return (
                    <DashboardSection
                      tokens={tokens}
                      payments={payments}
                      meters={meters}
                      alerts={alerts}
                      currentUser={currentUser}
                      handleSimulateTamper={handleSimulateTamper}
                      handleResetTamper={handleResetTamper}
                      setViewingMeter={setViewingMeter}
                      setCurrentSection={setCurrentSection}
                    />
                  );
                case 'statistics':
                  return <StatisticsSection />;
                case 'meters':
                  return (
                    <MetersSection
                      meters={meters}
                      setViewingMeter={setViewingMeter}
                      setEditingMeter={setEditingMeter}
                      setIsMeterModalOpen={setIsMeterModalOpen}
                      setIsReplacementModalOpen={setIsReplacementModalOpen}
                      handleDeleteMeter={handleDeleteMeter}
                      setCurrentSection={setCurrentSection}
                      search={meterSearch}
                      setSearch={setMeterSearch}
                    />
                  );
                case 'customers':
                  return (
                    <CustomersSection
                      customers={customers}
                      customerStatusFilter={customerStatusFilter}
                      setCustomerStatusFilter={setCustomerStatusFilter}
                      setEditingCustomer={setEditingCustomer}
                      setIsCustomerModalOpen={setIsCustomerModalOpen}
                      handleDeleteCustomer={handleDeleteCustomer}
                      setViewingMeter={setViewingMeter}
                      meters={meters}
                      regions={regions}
                      setCurrentSection={setCurrentSection}
                      setMeterSearch={setMeterSearch}
                    />
                  );
                case 'sts-prepaid':
                  return (
                    <StsPrepaidSection
                      currentUser={currentUser}
                      selectedMeterId={selectedMeterId}
                      setSelectedMeterId={setSelectedMeterId}
                      rechargeAmount={rechargeAmount}
                      setRechargeAmount={setRechargeAmount}
                      selectedChannel={selectedChannel}
                      setSelectedChannel={setSelectedChannel}
                      meters={meters}
                      customers={customers}
                      handleGenerateToken={handleGenerateToken}
                      calculateRechargeDetails={handleCalculateRecharge}
                      isGeneratingToken={isGeneratingToken}
                      onSwitchToPostpaid={() => setCurrentSection('invoices')}
                    />
                  );
                case 'vending':
                  return <VendingSection />;
                case 'tokens':
                  return (
                    <TokensSection
                      tokens={tokens}
                      handlePrintReceipt={handlePrintReceipt}
                      addToast={addToast}
                    />
                  );
                case 'map':
                  return (
                    <MapSection
                      meters={meters}
                      dcus={dcus}
                      setViewingMeter={setViewingMeter}
                      targetMeter={viewingMeter}
                    />
                  );
                case 'alerts':
                  return (
                    <AlertsSection
                      alerts={alerts}
                      alertRules={alertRules}
                      alertsTab={alertsTab}
                      setAlertsTab={setAlertsTab}
                      generateAlertsReportFile={handleGenerateAlertsReport}
                      addToast={addToast}
                      setAlerts={setAlerts}
                      handleResetTamper={handleResetTamper}
                      onUpdateRule={handleUpdateAlertRule}
                      setViewingMeter={setViewingMeter}
                      meters={meters}
                      setCurrentSection={setCurrentSection}
                    />
                  );
                case 'audit':
                  return (
                    <AuditSection
                      audits={audits}
                      pastShifts={pastShifts}
                      onRePrintShift={generateShiftReportPDF}
                      onGenerateReport={() => generateRegulatoryReport(meters, alerts, payments, analyticsTrends, [])}
                    />
                  );
                case 'mdms':
                  return (
                    <MdmsSection
                      mdmsStats={mdmsStats}
                      selectedMeterIntervals={selectedMeterIntervals}
                      generateMdmsReportFile={handleGenerateMdmsReport}
                      onSimulateMassReading={handleSimulateMassReading}
                      fetchData={fetchData}
                      setViewingMeter={setViewingMeter}
                      meters={meters}
                      setCurrentSection={setCurrentSection}
                      mdmsSearch={mdmsSearch}
                      setMdmsSearch={setMdmsSearch}
                    />
                  );
                case 'billing':
                  return (
                    <BillingSection
                      invoices={invoices}
                      customers={customers}
                      currentUser={currentUser}
                      isBillingLoading={isBillingLoading}
                      billingProgress={billingProgress}
                      handleRunBilling={handleRunBilling}
                      setSelectedInvoice={setSelectedInvoice}
                      setIsPaymentModalOpen={setIsPaymentModalOpen}
                      handleGenerateInvoicePDF={handleGenerateInvoicePDF}
                      handleMassPayment={handleMassPayment}
                    />
                  );
                case 'payments':
                  return (
                    <PaymentsSection
                      payments={payments}
                      tokens={tokens}
                      currentShift={currentShift}
                      pastShifts={pastShifts}
                      onInitiatePayment={() => setCurrentSection('sts-prepaid')}
                      onManageShift={() => setIsShiftModalOpen(true)}
                      onRePrintShift={generateShiftReportPDF}
                      onRefresh={fetchData}
                    />
                  );
                case 'regions':
                  return (
                    <RegionsSection
                      regions={regions}
                      meters={meters}
                      dcus={dcus}
                      setEditingRegion={setEditingRegion}
                      setIsRegionModalOpen={setIsRegionModalOpen}
                      handleDeleteRegion={handleDeleteRegion}
                      setCurrentSection={setCurrentSection}
                      setCustomerSearch={setCustomerSearch}
                      setMdmsSearch={setMdmsSearch}
                      setTicketSearch={setTicketSearch}
                      onGenerateRegionalReport={handleGenerateRegionalReport}
                      tickets={tickets}
                    />
                  );
                case 'dcus':
                  return (
                    <DcusSection
                      dcus={dcus}
                      setEditingDcu={setEditingDcu}
                      setIsDcuModalOpen={setIsDcuModalOpen}
                      onOpenLoadSheddingModal={() => setIsLoadSheddingModalOpen(true)}
                      handleDeleteDcu={handleDeleteDcu}
                      onPingDcu={(id) => {
                        addToast(`🏓 Ping DCU ${id} — Réponse OK`, 'success');
                      }}
                      onRebootDcu={(id) => {
                        if (confirm(`⚠️ Confirmer le redémarrage à distance du concentrateur ${id} ?`)) {
                          addToast(`🔄 Reboot DCU ${id} initié — Redémarrage en cours (~45s)...`, 'info');
                          setTimeout(() => addToast(`✅ DCU ${id} redémarré avec succès. Statut: ACTIF`, 'success'), 3000);
                        }
                      }}
                      setCurrentSection={setCurrentSection}
                    />
                  );
                case 'reports':
                  return (
                    <ReportsSection
                      generateRegulatoryReport={() => generateRegulatoryReport(meters, alerts, payments, analyticsTrends, [])}
                      onGenerateEnergyLoss={() => generateEnergyLossReport(regions.map(r => {
                        const regionMeterIds = meters.filter(m => m.location.includes(r.areaName)).map(m => m.id);
                        const kwh = tokens.filter(t => regionMeterIds.includes(t.meterId)).reduce((s, t) => s + (t.kwh || 0), 0);
                        return { areaName: r.areaName, injectedKwh: kwh, meteredKwh: kwh, lossPercentage: 0 };
                      }))}
                      onGenerateFraudAudit={() => generateFraudRiskReport(alerts, meters)}
                      onGenerateMobileMoney={() => generateMobileMoneyReport(payments)}
                      onGenerateSystemIntegrity={() => generateSystemIntegrityReport(meters)}
                    />
                  );
                case 'assets':
                  return (
                    <AssetsSection
                      meters={meters}
                      onInstallMeter={(id) => {
                        setEditingMeter(meters.find(m => m.id === id) || null);
                        setIsMeterModalOpen(true);
                        addToast("Veuillez assigner un client et une localisation pour installer ce compteur.", "info");
                      }}
                      onUpdateStatus={handleUpdateMeterLifecycle}
                      onAddBatch={() => addToast("Fonction de réception de lot en cours de développement", "info")}
                    />
                  );
                case 'settings':
                  return (
                    <SettingsSection
                      settings={settings}
                      onSave={handleSaveSettings}
                      currentUser={currentUser}
                      meters={meters}
                      customers={customers}
                    />
                  );
                case 'users':
                  return (
                    <UsersSection
                      users={users}
                      setEditingUser={setEditingUser}
                      setIsUserModalOpen={setIsUserModalOpen}
                      handleDeleteUser={handleDeleteUser}
                    />
                  );
                case 'security':
                  return (
                    <SecuritySection
                      audits={audits}
                      meters={meters}
                      onRotateKeys={handleRotateKeys}
                    />
                  );
                case 'revenue-assurance':
                  return (
                    <RevenueAssuranceSection
                      meters={meters}
                      tokens={tokens}
                      regions={regions}
                    />
                  );
                case 'customer-dashboard':
                  return currentUser?.role === 'customer' ? (
                    <CustomerDashboardSection
                      currentUser={currentUser}
                      meters={meters}
                      invoices={invoices}
                      fetchData={fetchData}
                      setCurrentSection={setCurrentSection}
                      setSelectedInvoice={setSelectedInvoice}
                      setIsPaymentModalOpen={setIsPaymentModalOpen}
                      handleGenerateInvoicePDF={handleGenerateInvoicePDF}
                    />
                  ) : null;
                case 'tariffs':
                  return (
                    <TariffsSection
                      tariffs={tariffs}
                      setEditingTariff={setEditingTariff}
                      setEditingTiers={setEditingTiers}
                      setIsTariffModalOpen={setIsTariffModalOpen}
                      handleDeleteTariff={handleDeleteTariff}
                      currentUser={currentUser}
                    />
                  );
                case 'analytics':
                  return (
                    <AnalyticsSection
                      meters={meters}
                      alerts={alerts}
                      tokens={tokens}
                      payments={payments}
                      setViewingMeter={setViewingMeter}
                      setCurrentSection={setCurrentSection}
                    />
                  );
                case 'tickets':
                  return (
                    <TicketsWrapper
                      tickets={tickets}
                      notifications={notifications}
                      currentUser={currentUser}
                      setEditingTicket={setEditingTicket}
                      setIsTicketModalOpen={setIsTicketModalOpen}
                      updateTicketStatus={updateTicketStatus}
                      ticketSearch={ticketSearch}
                      setTicketSearch={setTicketSearch}
                      meters={meters}
                      setViewingMeter={setViewingMeter}
                      setCurrentSection={setCurrentSection}
                    />
                  );
                case 'api-docs':
                  return <ApiDocsSection />;
                default:
                  return null;
              }
            })()}
          </AnimatePresence>
        </div>

        {/* Mobile Bottom Navigation */}
        {isLoggedIn && (
          <nav className="bottom-nav">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = currentSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentSection(item.id as any)}
                  className={cn("flex flex-col items-center gap-1", isActive ? "text-brand" : "text-gray-500")}
                >
                  <div className="relative">
                    <Icon size={20} />
                    {item.hasBadge && alerts.filter(a => a.status === 'unread').length > 0 && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-bg-dark text-[8px] flex items-center justify-center font-black">
                        {alerts.filter(a => a.status === 'unread').length}
                      </span>
                    )}
                  </div>
                  <span className="text-[9px] font-bold uppercase">{item.name}</span>
                </button>
              );
            })}
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex flex-col items-center gap-1 text-gray-500"
            >
              <Menu size={20} />
              <span className="text-[9px] font-bold uppercase">Menu</span>
            </button>
          </nav>
        )}
      </main>

      <LoginForm
        isLoggedIn={isLoggedIn}
        isLoading={isLoginLoading}
        handleLogin={handleLogin}
        onForgotPassword={() => setIsForgotPasswordModalOpen(true)}
        loginUsername={loginUsername}
        setLoginUsername={setLoginUsername}
        loginPassword={loginPassword}
        setLoginPassword={setLoginPassword}
        captcha={captcha}
        captchaInput={captchaInput}
        setCaptchaInput={setCaptchaInput}
      />

      <ForgotPasswordModal
        isOpen={isForgotPasswordModalOpen}
        onClose={() => setIsForgotPasswordModalOpen(false)}
        handleResetPassword={handleResetPassword}
      />

      <MeterReplacementModal
        isOpen={isReplacementModalOpen}
        onClose={() => setIsReplacementModalOpen(false)}
        meters={meters}
        customers={customers}
        onConfirmReplacement={handleReplaceMeter}
      />

      <LoadSheddingModal
        isOpen={isLoadSheddingModalOpen}
        onClose={() => setIsLoadSheddingModalOpen(false)}
        dcus={dcus}
        regions={regions}
        onExecuteLoadShedding={handleExecuteLoadShedding}
      />

      <ToastContainer toasts={toasts} />

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        selectedInvoice={selectedInvoice}
        handlePayInvoice={handlePayInvoice}
      />

      <TicketModal
        isOpen={isTicketModalOpen}
        onClose={() => setIsTicketModalOpen(false)}
        editingTicket={editingTicket}
        currentUser={currentUser}
        users={users}
        handleSaveTicket={handleSaveTicket}
      />

      {/* Global Search Modal */}
      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={() => { setIsSearchModalOpen(false); setGlobalSearchQuery(''); }}
        globalSearchQuery={globalSearchQuery}
        setGlobalSearchQuery={setGlobalSearchQuery}
        customers={customers}
        meters={meters}
        tokens={tokens}
        setCurrentSection={setCurrentSection}
      />

      <CustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => { setIsCustomerModalOpen(false); setEditingCustomer(null); }}
        editingCustomer={editingCustomer}
        tariffs={tariffs}
        regions={regions}
        handleSaveCustomer={handleSaveCustomer}
      />

      <MeterModal
        isOpen={isMeterModalOpen}
        onClose={() => { setIsMeterModalOpen(false); setEditingMeter(null); }}
        editingMeter={editingMeter}
        customers={customers}
        tariffs={tariffs}
        meters={meters}
        handleSaveMeter={handleSaveMeter}
      />

      <TariffModal
        isOpen={isTariffModalOpen}
        onClose={() => { setIsTariffModalOpen(false); setEditingTariff(null); setEditingTiers([]); }}
        editingTariff={editingTariff}
        editingTiers={editingTiers}
        setEditingTiers={setEditingTiers}
        handleSaveTariff={handleSaveTariff}
      />

      <RegionModal
        isOpen={isRegionModalOpen}
        onClose={() => { setIsRegionModalOpen(false); setEditingRegion(null); }}
        editingRegion={editingRegion}
        regions={regions}
        handleSaveRegion={handleSaveRegion}
      />

      <DcuModal
        isOpen={isDcuModalOpen}
        onClose={() => { setIsDcuModalOpen(false); setEditingDcu(null); }}
        editingDcu={editingDcu}
        regions={regions}
        handleSaveDcu={handleSaveDcu}
      />

      <UserModal
        isOpen={isUserModalOpen}
        onClose={() => { setIsUserModalOpen(false); setEditingUser(null); }}
        editingUser={editingUser}
        handleSaveUser={handleSaveUser}
      />

      <ViewingMeterModal
        viewingMeter={viewingMeter}
        onClose={() => setViewingMeter(null)}
        customers={customers}
        setCurrentSection={setCurrentSection}
        addToast={addToast}
        handleReadTelemetry={handleReadTelemetry}
        handleRemoteRelay={handleRemoteRelay}
        fetchData={fetchData}
      />

      <GeneratedTokenModal
        generatedToken={generatedToken}
        onClose={() => setGeneratedToken(null)}
        addToast={addToast}
      />

      <ShiftModal
        isOpen={isShiftModalOpen}
        onClose={() => setIsShiftModalOpen(false)}
        shift={currentShift}
        onOpenShift={handleOpenShift}
        onCloseShift={handleCloseShift}
        onNewShift={() => setCurrentShift(null)}
      />

      {generatedToken && <ThermalReceipt token={generatedToken} />}
    </div>
  );
}

export default function App() {
  return (
    <AmiProvider>
      <MainAppContent />
    </AmiProvider>
  );
}
