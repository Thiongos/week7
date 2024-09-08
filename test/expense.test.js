import chai from 'chai';
import chaiHttp from 'chai-http';
import server from '../index.js'; // Ensure this path is correct

const { expect } = chai; // Destructure `expect` from `chai`

chai.use(chaiHttp);

describe('Expense Tracker API', () => {
  let token = ''; 

  // Test user registration
  it('should register a new user', (done) => {
    chai.request(server)
      .post('/api/auth/register')
      .send({
        username: 'testuser',
        email: 'testuser@example.com',
        password: 'password123'
      })
      .end((err, res) => {
        expect(res).to.have.status(201);
        expect(res.body).to.have.property('message').eql('User registered successfully');
        done();
      });
  });

  // Test user login and store the token
  it('should log in and return a JWT token', (done) => {
    chai.request(server)
      .post('/api/auth/login')
      .send({
        email: 'testuser@example.com',
        password: 'password123'
      })
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.have.property('token');
        token = res.body.token; 
        done();
      });
  });

  // Test getting expenses (should fail without authentication)
  it('should return 401 for getting expenses without token', (done) => {
    chai.request(server)
      .get('/api/expenses')
      .end((err, res) => {
        expect(res).to.have.status(401);
        expect(res.body).to.have.property('error').eql('No token provided');
        done();
      });
  });

  // Test getting expenses (should pass with valid token)
  it('should return expenses with valid token', (done) => {
    chai.request(server)
      .get('/api/expenses')
      .set('Authorization', `Bearer ${token}`)
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.be.an('array'); 
        done();
      });
  });

  // Test adding an expense
  it('should add a new expense', (done) => {
    chai.request(server)
      .post('/api/expenses')
      .set('Authorization', `Bearer ${token}`)
      .send({
        id: 1,
        amount: 100,
        description: 'Test Expense'
      })
      .end((err, res) => {
        expect(res).to.have.status(201);
        expect(res.body).to.have.property('amount').eql(100);
        expect(res.body).to.have.property('description').eql('Test Expense');
        done();
      });
  });

  // Test updating an expense
  it('should update an existing expense', (done) => {
    chai.request(server)
      .put('/api/expenses/1')
      .set('Authorization', `Bearer ${token}`)
      .send({
        amount: 150,
        description: 'Updated Test Expense'
      })
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.have.property('amount').eql(150);
        expect(res.body).to.have.property('description').eql('Updated Test Expense');
        done();
      });
  });

  // Test deleting an expense
  it('should delete an existing expense', (done) => {
    chai.request(server)
      .delete('/api/expenses/1')
      .set('Authorization', `Bearer ${token}`)
      .end((err, res) => {
        expect(res).to.have.status(204); 
        done();
      });
  });

  // Test getting total expenses
  it('should return total expenses', (done) => {
    chai.request(server)
      .get('/api/expense')
      .set('Authorization', `Bearer ${token}`)
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.have.property('total').eql(0); 
        done();
      });
  });

});
