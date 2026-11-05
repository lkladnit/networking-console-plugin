import { adminOnlyDescribe } from '../../utils/const/base';
import { NAD_LOCALNET } from '../../utils/const/nad';
import { createNAD, deleteNAD, withNetworkType } from '../../views/nad';

adminOnlyDescribe('Test secondary localnet NAD', () => {
  it('create NAD with secondary localnet network', function () {
    cy.visitNAD();
    withNetworkType('secondary localnet', this, () => createNAD(NAD_LOCALNET));
  });

  it('delete NAD', function () {
    cy.visitNAD();
    deleteNAD(NAD_LOCALNET.name);
  });
});
