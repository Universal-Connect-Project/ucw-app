const axios = require('axios');

jest.mock('axios');
const baseUrl = 'http://127.0.0.1:8080/';

beforeAll(() => {
  jest.mock('axios');
});

describe('Test Routes', () => {
  test('Default route', async () => {
    axios.get = jest.fn().mockResolvedValue({
      status: 200,
      data: '<!DOCTYPE html><html lang="en"><body>Website created using create-react-app</body></html>'
    });

    const res = await axios.get(`${baseUrl}`);

    expect(res).toBeTruthy();
    expect(res.status).toBe(200);
    expect(res.data).toContain('<!DOCTYPE html>');
    expect(res.data).toContain('Website created using create-react-app');
  });

  test('PING route', async () => {
    axios.get = jest.fn().mockResolvedValue({
      status: 200,
      data: 'ok'
    });

    const res = await axios.get(`${baseUrl}ping`);

    expect(res).toBeTruthy();
    expect(res.status).toBe(200);
    expect(res.data).toEqual('ok');
  });
});
