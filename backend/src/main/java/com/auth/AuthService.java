package com.bugboard26.auth;

import com.bugboard26.user.User;
import com.bugboard26.user.UserRepository;
import com.bugboard26.user.UserRole;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager,
            JwtService jwtService
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
    }

    public LoginResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.email(),
                        request.password()
                )
        );

        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new IllegalArgumentException("Credenziali non valide"));

        String token = jwtService.generateToken(user.getEmail(), user.getRole().name());

        return new LoginResponse(
                token,
                user.getId(),
                user.getEmail(),
                user.getRole(),
                user.isMustChangePassword()
        );
    }

    public UserResponse createUser(CreateUserRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("Email già utilizzata");
        }

        User user = new User(
                request.email(),
                passwordEncoder.encode(request.password()),
                request.role()
        );

        User savedUser = userRepository.save(user);
        return UserResponse.fromEntity(savedUser);
    }

    public List<UserResponse> getAllUsers() {
        return userRepository.findAll()
                .stream()
                .map(UserResponse::fromEntity)
                .toList();
    }

    public void disableUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Utente non trovato"));

        if (user.getRole() == UserRole.ADMIN) {
            long enabledAdmins = userRepository.findAll()
                    .stream()
                    .filter(u -> u.getRole() == UserRole.ADMIN && u.isEnabled())
                    .count();

            if (enabledAdmins <= 1) {
                throw new IllegalArgumentException("Non puoi disabilitare l'unico amministratore attivo");
            }
        }

        user.setEnabled(false);
        userRepository.save(user);
    }

    public UserResponse changePassword(ChangePasswordRequest request, Authentication authentication) {
        String email = authentication.getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Utente non trovato"));

        if (!passwordEncoder.matches(request.oldPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("La vecchia password non è corretta");
        }

        if (passwordEncoder.matches(request.newPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("La nuova password deve essere diversa da quella attuale");
        }

        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        user.setMustChangePassword(false);

        User savedUser = userRepository.save(user);

        return UserResponse.fromEntity(savedUser);
    }
}