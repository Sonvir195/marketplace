const Marketplace = artifacts.require("./Marketplace.sol");

require('chai')
  .use(require('chai-as-promised'))
  .should()

contract('Marketplace', ([deployer,seller,buyer]) => {
  let marketplace

  before(async () => {
    marketplace = await Marketplace.deployed()
  })

  describe('deployment', async() => {

    it('deploys successfully', async() => {
      const address = await marketplace.address
      assert.notEqual(address, 0*0)
      assert.notEqual(address, '')
      assert.notEqual(address, null)
      assert.notEqual(address, undefined)
    })

    it('has a name', async() => {
      const name = await marketplace.name()
      assert.equal(name, 'My Marketplace')
    })
  })

  describe('products', async() => {

    let result, productCount
    before(async () => {
      result = await marketplace.createProduct('I Phone X', web3.utils.toWei('1', 'Ether'), { from : seller})
      productCount = await marketplace.productCount()
    })

    it('creates products', async() => {
      //Success
      assert.equal(productCount, 1)
      const event = result.logs[0].args
      assert.equal(event.id.toNumber(), productCount.toNumber(), 'Id is correct')
      assert.equal(event.name,'I Phone X', 'Name is correct')
      assert.equal(event.price, '1000000000000000000', 'Price is correct')
      assert.equal(event.owner,seller,'Owner is correct')
      assert.equal(event.purchased, false, 'purchased is correct')

      // FAILURE: Product must have a name
      await marketplace.createProduct('', web3.utils.toWei('1', 'Ether'), { from : seller}).should.be.rejected;

      // FAILURE: Product must have a valid price
      await marketplace.createProduct('I Phone X', 0, { from : seller}).should.be.rejected;

    })

    it('lists products', async() => {
      const product = await marketplace.products(productCount)
      assert.equal(product.id.toNumber(), productCount.toNumber(), 'Id is correct')
      assert.equal(product.name,'I Phone X', 'Name is correct')
      assert.equal(product.price, '1000000000000000000', 'Price is correct')
      assert.equal(product.owner,seller,'Owner is correct')
      assert.equal(product.purchased, false, 'purchased is correct')      
      
    })

    it('sells products', async() => {
      //Track the Seller balance before purchase

      let oldSellerBalance
      oldSellerBalance = await web3.eth.getBalance(seller)
      oldSellerBalance = new web3.utils.BN(oldSellerBalance)


      //SUCCESS : Buyer makes purchase

      result = await marketplace.purchaseProduct(productCount, { from : buyer, value : web3.utils.toWei('1', 'Ether')})
       
      //Check logs

      const event = result.logs[0].args
      assert.equal(event.id.toNumber(), productCount.toNumber(), 'Id is correct')
      assert.equal(event.name,'I Phone X', 'Name is correct')
      assert.equal(event.price, '1000000000000000000', 'Price is correct')
      assert.equal(event.owner,buyer,'Owner is correct')
      assert.equal(event.purchased, true, 'purchased is correct') 


      //Check Seller receives funds

      let newSellerBalance
      newSellerBalance = await web3.eth.getBalance(seller)
      newSellerBalance = new web3.utils.BN(newSellerBalance)

      let price
      price = web3.utils.toWei('1', 'Ether')
      price = new web3.utils.BN(price)

      const expectedBalance = oldSellerBalance.add(price)
      assert.equal(newSellerBalance.toString(), expectedBalance.toString())



      // FAILURE: Tries to buy the product that does not exist, i.e. product must have valid id
      await marketplace.purchaseProduct(99, { from : buyer, value : web3.utils.toWei('1', 'Ether')}).should.be.rejected;
      
      //FAILURE : Buyer tries to buy without enough ether
      await marketplace.purchaseProduct(productCount, { from : buyer, value : web3.utils.toWei('0.5', 'Ether')}).should.be.rejected;

      //FAILURE : Deployer tries to buy the product, i.e. product can't be purchased twice
      await marketplace.purchaseProduct(productCount, { from : deployer, value : web3.utils.toWei('1', 'Ether')}).should.be.rejected;

      //FAILURE : Buyer tries to buy again, i.e. buyer can't be a seller
      await marketplace.purchaseProduct(productCount, { from : buyer, value : web3.utils.toWei('1', 'Ether')}).should.be.rejected;

      
    })
  })

})
