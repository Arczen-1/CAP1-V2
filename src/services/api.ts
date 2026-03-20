const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ApiService {
  private token: string | null;

  constructor() {
    this.token = localStorage.getItem('token');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('token');
  }

  async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_URL}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'An error occurred' }));
      const error: any = new Error(errorData.message || `HTTP error! status: ${response.status}`);
      // Attach validation errors if present
      if (errorData.errors) {
        error.errors = errorData.errors;
      }
      if (errorData.issues) {
        error.issues = errorData.issues;
      }
      if (errorData.error) {
        error.detail = errorData.error;
      }
      throw error;
    }

    return response.json();
  }

  // Auth
  async login(email: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  }

  async requestPasswordReset(email: string) {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  }

  async resetPassword(email: string, resetCode: string, newPassword: string) {
    return this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, resetCode, newPassword })
    });
  }

  async getMe() {
    return this.request('/auth/me');
  }

  // Menu Tastings
  async getMenuTastings(params?: { status?: string; fromDate?: string; toDate?: string }) {
    const queryParams = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return this.request(`/menu-tastings${queryParams}`);
  }

  async getMenuTasting(id: string) {
    return this.request(`/menu-tastings/${id}`);
  }

  async createMenuTasting(data: any) {
    return this.request('/menu-tastings', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateMenuTasting(id: string, data: any) {
    return this.request(`/menu-tastings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteMenuTasting(id: string) {
    return this.request(`/menu-tastings/${id}`, {
      method: 'DELETE'
    });
  }

  async linkContractToTasting(tastingId: string, contractId: string) {
    return this.request(`/menu-tastings/${tastingId}/link-contract`, {
      method: 'POST',
      body: JSON.stringify({ contractId })
    });
  }

  async getTastingStats() {
    return this.request('/menu-tastings/stats/overview');
  }

  async getAvailableTastingSlots(date: string) {
    return this.request(`/menu-tastings/slots/available?date=${date}`);
  }

  // Contracts
  async getContracts() {
    return this.request('/contracts');
  }

  async getContract(id: string) {
    return this.request(`/contracts/${id}`);
  }

  async getContractOperationsSummary(id: string) {
    return this.request(`/contracts/${id}/operations-summary`);
  }

  async createContract(data: any) {
    return this.request('/contracts', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateContract(id: string, data: any) {
    return this.request(`/contracts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async updateKitchenMenuItem(id: string, data: { index: number; confirmed: boolean }) {
    return this.request(`/contracts/${id}/kitchen-menu-item`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async updateKitchenIngredientStatus(id: string, data: { status: 'pending' | 'procured' | 'prepared' }) {
    return this.request(`/contracts/${id}/kitchen-ingredient-status`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteContract(id: string) {
    return this.request(`/contracts/${id}`, {
      method: 'DELETE'
    });
  }

  async submitContract(id: string) {
    return this.request(`/contracts/${id}/submit`, {
      method: 'POST'
    });
  }

  async markContractClientSigned(id: string) {
    return this.request(`/contracts/${id}/client-signature`, {
      method: 'POST'
    });
  }

  async updateContractSignatureAssets(id: string, data: any) {
    return this.request(`/contracts/${id}/signature-assets`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async updateContractSectionConfirmation(id: string, data: { section: string; confirmed: boolean }) {
    return this.request(`/contracts/${id}/section-confirmation`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async approveContract(id: string) {
    return this.request(`/contracts/${id}/approve`, {
      method: 'POST'
    });
  }

  async completeContract(id: string) {
    return this.request(`/contracts/${id}/complete`, {
      method: 'POST'
    });
  }

  async updateLogisticsAssignment(id: string, data: any) {
    return this.request(`/contracts/${id}/logistics-assignment`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async updateBanquetAssignment(id: string, data: any) {
    return this.request(`/contracts/${id}/banquet-assignment`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async addPayment(id: string, payment: any) {
    return this.request(`/contracts/${id}/payment`, {
      method: 'POST',
      body: JSON.stringify(payment)
    });
  }

  async updateInventoryItemStatus(id: string, data: any) {
    return this.request(`/contracts/${id}/inventory-item-status`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async updateInventoryPostEventStatus(id: string, data: any) {
    return this.request(`/contracts/${id}/inventory-post-event-status`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async reportInventoryIncident(id: string, data: any) {
    return this.request(`/contracts/${id}/inventory-incident`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getProcurementRequests(params?: {
    department?: string;
    status?: string;
    contractId?: string;
    requestType?: string;
  }) {
    const filteredParams = params
      ? Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ''))
      : null;
    const queryParams = filteredParams ? `?${new URLSearchParams(filteredParams as Record<string, string>).toString()}` : '';
    return this.request(`/procurement-requests${queryParams}`);
  }

  async createProcurementRequest(data: any) {
    return this.request('/procurement-requests', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateProcurementQuote(id: string, data: any) {
    return this.request(`/procurement-requests/${id}/quote`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async reviewProcurementRequest(id: string, data: any) {
    return this.request(`/procurement-requests/${id}/accounting-review`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async fulfillProcurementRequest(id: string, data: any) {
    return this.request(`/procurement-requests/${id}/fulfill`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getSuppliers(params?: {
    department?: string;
    requestType?: string;
    active?: boolean;
  }) {
    const filteredParams = params
      ? Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ''))
      : null;
    const queryParams = filteredParams
      ? `?${new URLSearchParams(Object.fromEntries(
        Object.entries(filteredParams).map(([key, value]) => [key, String(value)])
      )).toString()}`
      : '';
    return this.request(`/suppliers${queryParams}`);
  }

  async createSupplier(data: any) {
    return this.request('/suppliers', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateSupplier(id: string, data: any) {
    return this.request(`/suppliers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteSupplier(id: string) {
    return this.request(`/suppliers/${id}`, {
      method: 'DELETE'
    });
  }

  async updateProgress(id: string, department: string, progress: number) {
    return this.request(`/contracts/${id}/progress/${department}`, {
      method: 'POST',
      body: JSON.stringify({ progress })
    });
  }

  async getDashboardStats() {
    return this.request('/contracts/stats/dashboard');
  }

  // Logistics
  async getDrivers() {
    return this.request('/logistics/drivers');
  }

  async createDriver(data: any) {
    return this.request('/logistics/drivers', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateDriver(id: string, data: any) {
    return this.request(`/logistics/drivers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteDriver(id: string) {
    return this.request(`/logistics/drivers/${id}`, {
      method: 'DELETE'
    });
  }

  async getTrucks() {
    return this.request('/logistics/trucks');
  }

  async createTruck(data: any) {
    return this.request('/logistics/trucks', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateTruck(id: string, data: any) {
    return this.request(`/logistics/trucks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteTruck(id: string) {
    return this.request(`/logistics/trucks/${id}`, {
      method: 'DELETE'
    });
  }

  async assignDriverToTruck(truckId: string, driverId: string) {
    return this.request(`/logistics/trucks/${truckId}/assign-driver`, {
      method: 'POST',
      body: JSON.stringify({ driverId })
    });
  }

  async getLogisticsStats() {
    const stats = await this.request('/logistics/stats/overview');
    const totalTrucks = stats.trucks?.total || 0;
    const availableTrucks = stats.trucks?.available || 0;

    return {
      totalDrivers: stats.drivers?.total || 0,
      totalTrucks,
      availableTrucks,
      assignedTrucks: Math.max(0, totalTrucks - availableTrucks),
    };
  }

  // Incidents
  async getIncidents() {
    return this.request('/incidents');
  }

  async getIncidentsByContract(contractId: string) {
    return this.request(`/incidents/contract/${contractId}`);
  }

  async createIncident(data: any) {
    return this.request('/incidents', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateIncident(id: string, data: any) {
    return this.request(`/incidents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  // Notifications
  async getNotifications() {
    return this.request('/notifications');
  }

  async getUnreadCount() {
    return this.request('/notifications/unread-count');
  }

  async markNotificationRead(id: string) {
    return this.request(`/notifications/${id}/read`, {
      method: 'PUT'
    });
  }

  async markAllNotificationsRead() {
    return this.request('/notifications/read-all', {
      method: 'PUT'
    });
  }
}

export const api = new ApiService();
