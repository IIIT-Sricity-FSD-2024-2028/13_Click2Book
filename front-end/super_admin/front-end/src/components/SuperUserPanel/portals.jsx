/**
 * The Super User panel preconfigured for each portal, mirroring the
 * crud functions/js/ui-<role>.js files the original pages loaded.
 */
import { useState } from 'react';
import SuperUserPanel from './SuperUserPanel';
import { createAdminSchemas } from '../../lib/crudSchemas/admin';
import { createCustomerSchemas } from '../../lib/crudSchemas/customer';
import { createProviderSchemas } from '../../lib/crudSchemas/provider';
import { createSupportSchemas } from '../../lib/crudSchemas/support';

function usePanelSchemas(factory) {
  const [schemas] = useState(factory);
  return schemas;
}

/** Customer pages hide the floating button; open with ?superUser=open. */
export function CustomerSuperUserPanel(props) {
  const schemas = usePanelSchemas(createCustomerSchemas);
  return <SuperUserPanel schemas={schemas} defaultTable="myBookings" actorLabel="Customer Portal" hideToggle {...props} />;
}

export function ProviderSuperUserPanel(props) {
  const schemas = usePanelSchemas(createProviderSchemas);
  return <SuperUserPanel schemas={schemas} defaultTable="myVehicles" actorLabel="Service Provider Portal" {...props} />;
}

export function SupportSuperUserPanel(props) {
  const schemas = usePanelSchemas(createSupportSchemas);
  return <SuperUserPanel schemas={schemas} defaultTable="supportRequests" actorLabel="Support Agent Portal" {...props} />;
}

export function AdminSuperUserPanel(props) {
  const schemas = usePanelSchemas(createAdminSchemas);
  return <SuperUserPanel schemas={schemas} defaultTable="bookings" actorLabel="Super Admin Portal" {...props} />;
}
