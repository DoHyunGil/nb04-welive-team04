import authRepository from '../repositories/auth.repository.js';

class AuthService {
  async login() {
    //만약 권한 인증 같은걸 해야하면 여기 서비스에서 처리하세요. req.user 어쩌고..

    //DB에 필요한 매개변수를 보내고, 여기서 반환해오면 됩니다.
    const data = authRepository.login();
    
    //그리고 여기서 프론트엔드가 원하는 양식대로 API 문서 참고하셔서 가공해주시고,
    //컨트롤러로 반환해주세요
    // return reuslt;
  }
  async logout() {}
  async refresh() {}
}

export default new AuthService();
