const handle_oauth = require('./oauth')
global.window = {
  location: '',
  opener: {
    postMessage: jest.fn(),
    location: 'original_location'
  }
}
global.document = {
  getElementById : jest.fn()
}
describe(' handle_oauth', () => {
  describe(' handle_oauth', () => {
    it('redirects', () => {
      handle_oauth(true, 'app_url', 'post_message', 'member_guid', 'error_reason')
      expect(global.window.location).toEqual('app_url')
      expect(global.document.getElementById).toHaveBeenCalledWith('oauth-close-window')
    })
    it('posts message', () => {
      handle_oauth(false, 'app_url', 'post_message', 'member_guid', 'error_reason')
      expect(global.window.opener.postMessage).toHaveBeenCalledWith({
        mx: true,
        type: 'post_message',
        metadata: {
          member_guid: 'member_guid',
          error_reason: 'error_reason',
        }
      }, '*')
    })
  })
})
